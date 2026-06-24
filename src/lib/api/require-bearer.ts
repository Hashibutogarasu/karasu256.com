import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { apiKeys, oauthAccessTokens } from "@Hashibutogarasu/db/schema";
import { hashSecret } from "@/lib/crypto";

type BearerResult =
  | { userId: string; permissions: bigint | null; error: null }
  | { userId: null; permissions: null; error: NextResponse };

const unauthorized = (): BearerResult => ({
  userId: null,
  permissions: null,
  error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
});

/**
 * Authenticates a request using a Bearer token from the Authorization header.
 *
 * Tokens prefixed with "ksk_" are treated as API keys (no scope restriction,
 * permissions returns null). All other tokens are looked up as OAuth access
 * tokens and must be non-expired and non-revoked.
 *
 * Updates lastUsedAt on each successful lookup.
 */
export async function requireBearer(request: NextRequest): Promise<BearerResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized();

  const token = authHeader.slice(7);
  if (!token) return unauthorized();

  const tokenHash = await hashSecret(token);
  const db = getDb();
  const now = new Date();

  if (token.startsWith("ksk_")) {
    const [row] = await db
      .select({ id: apiKeys.id, userId: apiKeys.userId })
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, tokenHash));

    if (!row) return unauthorized();

    await db.update(apiKeys).set({ lastUsedAt: now }).where(eq(apiKeys.id, row.id));
    return { userId: row.userId, permissions: null, error: null };
  }

  const [row] = await db
    .select({
      id: oauthAccessTokens.id,
      userId: oauthAccessTokens.userId,
      permissions: oauthAccessTokens.permissions,
      expiresAt: oauthAccessTokens.expiresAt,
      revokedAt: oauthAccessTokens.revokedAt,
    })
    .from(oauthAccessTokens)
    .where(eq(oauthAccessTokens.tokenHash, tokenHash));

  if (!row || row.revokedAt !== null || row.expiresAt <= now) return unauthorized();

  await db
    .update(oauthAccessTokens)
    .set({ lastUsedAt: now })
    .where(eq(oauthAccessTokens.id, row.id));

  return { userId: row.userId, permissions: row.permissions, error: null };
}
