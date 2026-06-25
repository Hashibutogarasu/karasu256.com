import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import {
  oauthAccessTokens,
  oauthAuthorizationCodes,
  oauthClients,
} from "@Hashibutogarasu/db/schema";
import { requireSession } from "@/lib/api/require-session";
import { generateSecret, hashSecret } from "@/lib/crypto";
import { OAuthApiError } from "@/lib/api/oauth-api-error";

interface TestStep {
  label: string;
  success: boolean;
  data?: Record<string, unknown>;
  /** OAuth error code passed to the client for i18n lookup. */
  error?: string;
}

/**
 * Exchanges a real authorization code obtained from the consent page for an
 * access token and verifies the token by fetching the user's profile.
 *
 * The caller must supply a `code` obtained by completing the OAuth authorization
 * flow via `/oauth/authorize`. The authenticated user must own the client, which
 * removes the need to supply the client secret.
 *
 * All tokens created during the test are cleaned up on completion.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = getDb();

  const [client] = await db
    .select({ id: oauthClients.id })
    .from(oauthClients)
    .where(and(eq(oauthClients.id, id), eq(oauthClients.userId, user.uid)));

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as unknown;
  if (typeof body !== "object" || body === null || typeof (body as Record<string, unknown>).code !== "string") {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const code = (body as Record<string, unknown>).code as string;
  const steps: TestStep[] = [];
  let tokenId: string | undefined;
  let currentStep: "access_token" | "profile_read" | "profile_write" = "access_token";

  try {
    const codeHash = await hashSecret(code);
    const [authCode] = await db
      .select({
        id: oauthAuthorizationCodes.id,
        userId: oauthAuthorizationCodes.userId,
        clientId: oauthAuthorizationCodes.clientId,
        permissions: oauthAuthorizationCodes.permissions,
        expiresAt: oauthAuthorizationCodes.expiresAt,
        usedAt: oauthAuthorizationCodes.usedAt,
      })
      .from(oauthAuthorizationCodes)
      .where(eq(oauthAuthorizationCodes.codeHash, codeHash));

    const now = new Date();

    if (!authCode || authCode.clientId !== client.id || authCode.usedAt !== null || authCode.expiresAt <= now) {
      throw new OAuthApiError("invalid_grant");
    }

    await db
      .update(oauthAuthorizationCodes)
      .set({ usedAt: now })
      .where(eq(oauthAuthorizationCodes.id, authCode.id));

    const { raw: accessToken, hash: tokenHash } = await generateSecret("tok_");
    const tokenPrefix = accessToken.slice(0, 12);
    const tokenExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const [insertedToken] = await db
      .insert(oauthAccessTokens)
      .values({
        tokenHash,
        tokenPrefix,
        clientId: client.id,
        userId: authCode.userId,
        permissions: authCode.permissions,
        expiresAt: tokenExpiresAt,
      })
      .returning({ id: oauthAccessTokens.id });

    tokenId = insertedToken.id;
    steps.push({
      label: "access_token",
      success: true,
      data: { token: tokenPrefix + "…", expires_in: 31536000 },
    });

    const origin = new URL(request.url).origin;
    const bearerHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    currentStep = "profile_read";
    const readRes = await fetch(`${origin}/api/profile`, { headers: bearerHeaders });
    if (!readRes.ok) {
      throw new OAuthApiError(readRes.status === 403 ? "insufficient_scope" : "token_verification_failed");
    }
    const profile = (await readRes.json()) as { id: string; name: string | null };
    steps.push({
      label: "profile_read",
      success: true,
      data: { id: profile.id, name: profile.name ?? null },
    });

    currentStep = "profile_write";
    const writeRes = await fetch(`${origin}/api/profile`, {
      method: "PATCH",
      headers: bearerHeaders,
      body: JSON.stringify({ name: profile.name }),
    });
    if (!writeRes.ok) {
      throw new OAuthApiError(writeRes.status === 403 ? "insufficient_scope" : "token_verification_failed");
    }
    const updated = (await writeRes.json()) as { id: string; name: string | null };
    steps.push({
      label: "profile_write",
      success: true,
      data: { id: updated.id, name: updated.name ?? null },
    });

    return NextResponse.json({ steps });
  } catch (err) {
    if (err instanceof OAuthApiError) {
      steps.push({ label: currentStep, success: false, error: err.code });
      return NextResponse.json({ steps });
    }
    if (tokenId) {
      await db.delete(oauthAccessTokens).where(eq(oauthAccessTokens.id, tokenId));
    }
    return NextResponse.json({ steps });
  }
}
