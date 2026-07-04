import { eq } from 'drizzle-orm';
import { oauthProviderResourceClient } from '@better-auth/oauth-provider/resource-client';
import { createRouteAuth } from '@Hashibutogarasu/utils/server';
import { getDb } from '@Hashibutogarasu/db';
import { apiKeys } from '@Hashibutogarasu/db/schema';
import { hashSecret } from '@/lib/crypto';

/**
 * better-auth's internal `baseURL` — and therefore the JWT `iss`/`aud` and
 * the JWKS location — includes the auth mount path (`/api/auth`), not just
 * the origin. `OAUTH_ISSUER_URL` is the bare origin; this appends the path
 * better-auth actually uses everywhere it needs the full issuer identifier.
 */
const OAUTH_ISSUER = `${process.env.OAUTH_ISSUER_URL}/api/auth`;

const resourceClient = oauthProviderResourceClient();

/**
 * Looks up a raw API key token and returns its owner, or `null` if the key
 * is unknown. API keys are unscoped, so no permission bitmask is returned.
 */
async function validateApiKey(token: string): Promise<{ userId: string } | null> {
  const db = getDb();
  const tokenHash = await hashSecret(token);

  const [row] = await db.select({ id: apiKeys.id, userId: apiKeys.userId }).from(apiKeys).where(eq(apiKeys.keyHash, tokenHash));

  if (!row) return null;

  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));
  return { userId: row.userId };
}

/**
 * Verifies a bearer token issued by accounts.karasu256.com's OAuth/OIDC
 * authorization server. Access tokens are JWTs, so this is a local,
 * DB-independent verification against the authorization server's published
 * JWKS — see `@better-auth/oauth-provider`'s recommendations for why this is
 * preferred over an opaque-token DB lookup or remote introspection.
 */
async function validateOauthToken(token: string): Promise<{ userId: string; scopes: string[] } | null> {
  try {
    const payload = await resourceClient.getActions().verifyAccessToken(token, {
      verifyOptions: { audience: OAUTH_ISSUER, issuer: OAUTH_ISSUER },
      jwksUrl: `${OAUTH_ISSUER}/jwks`,
    });
    if (!payload.sub) return null;
    const scopes = typeof payload.scope === 'string' ? payload.scope.split(' ') : [];
    return { userId: payload.sub, scopes };
  } catch {
    return null;
  }
}

/**
 * Derives the permission section key for a request from its API route path,
 * e.g. `/api/profile` -> `"profile"`.
 */
function deriveSectionKey(request: Request): string {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  const apiIndex = segments.indexOf('api');
  return segments[apiIndex + 1] ?? '';
}

export const { APIKeyRoute, OauthAppRoute, Read, Write } = createRouteAuth({
  validator: { validateApiKey, validateOauthToken },
  deriveSectionKey,
});
