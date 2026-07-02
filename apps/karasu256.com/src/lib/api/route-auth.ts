import { eq } from "drizzle-orm";
import { createRouteAuth } from "@Hashibutogarasu/utils/server";
import { getDb, hasPermission } from "@Hashibutogarasu/db";
import { apiKeys, oauthAccessTokens } from "@Hashibutogarasu/db/schema";
import { hashSecret } from "@/lib/crypto";

/**
 * Looks up a raw API key token and returns its owner, or `null` if the key
 * is unknown. API keys are unscoped, so no permission bitmask is returned.
 */
async function validateApiKey(token: string): Promise<{ userId: string } | null> {
  const db = getDb();
  const tokenHash = await hashSecret(token);

  const [row] = await db
    .select({ id: apiKeys.id, userId: apiKeys.userId })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, tokenHash));

  if (!row) return null;

  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));
  return { userId: row.userId };
}

/**
 * Looks up a raw OAuth access token and returns its owner and granted
 * permission bitmask. Expired or revoked tokens are treated as unknown.
 */
async function validateOauthToken(
  token: string,
): Promise<{ userId: string; permissions: bigint } | null> {
  const db = getDb();
  const tokenHash = await hashSecret(token);
  const now = new Date();

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

  if (!row || row.revokedAt !== null || row.expiresAt <= now) return null;

  await db
    .update(oauthAccessTokens)
    .set({ lastUsedAt: now })
    .where(eq(oauthAccessTokens.id, row.id));

  return { userId: row.userId, permissions: row.permissions };
}

/**
 * Derives the permission section key for a request from its API route path,
 * e.g. `/api/profile` -> `"profile"`.
 */
function deriveSectionKey(request: Request): string {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const apiIndex = segments.indexOf("api");
  return segments[apiIndex + 1] ?? "";
}

export const { APIKeyRoute, OauthAppRoute, Read, Write } = createRouteAuth({
  validator: { validateApiKey, validateOauthToken },
  permissionChecker: { hasPermission },
  deriveSectionKey,
});
