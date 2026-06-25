import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import {
  oauthAccessTokens,
  oauthAuthorizationCodes,
  oauthClients,
  users,
} from "@Hashibutogarasu/db/schema";
import { requireSession } from "@/lib/api/require-session";
import { generateSecret, hashSecret } from "@/lib/crypto";
import { hasPermission } from "@/lib/permissions/sections";

interface TestStep {
  label: string;
  success: boolean;
  data?: Record<string, unknown>;
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

  try {
    // Step 1 — exchange authorization code for access token
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
      steps.push({ label: "access_token", success: false, error: "invalid_grant" });
      return NextResponse.json({ steps });
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

    // Step 2 — verify the token and fetch profile
    const verifyHash = await hashSecret(accessToken);
    const [tokenRow] = await db
      .select({
        userId: oauthAccessTokens.userId,
        permissions: oauthAccessTokens.permissions,
        revokedAt: oauthAccessTokens.revokedAt,
        expiresAt: oauthAccessTokens.expiresAt,
      })
      .from(oauthAccessTokens)
      .where(eq(oauthAccessTokens.tokenHash, verifyHash));

    if (!tokenRow || tokenRow.revokedAt !== null || tokenRow.expiresAt <= new Date()) {
      steps.push({ label: "profile", success: false, error: "Token verification failed" });
      return NextResponse.json({ steps });
    }

    if (!hasPermission(tokenRow.permissions, "profile")) {
      steps.push({ label: "profile", success: false, error: "insufficient_scope" });
      return NextResponse.json({ steps });
    }

    const [profile] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, tokenRow.userId));

    steps.push({
      label: "profile",
      success: true,
      data: { id: profile?.id, name: profile?.name ?? null, permissions: Number(tokenRow.permissions) },
    });

    return NextResponse.json({ steps });
  } catch {
    if (tokenId) {
      await db.delete(oauthAccessTokens).where(eq(oauthAccessTokens.id, tokenId));
    }
    return NextResponse.json({ steps });
  }
}
