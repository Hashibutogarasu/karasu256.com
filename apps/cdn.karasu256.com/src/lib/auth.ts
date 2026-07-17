import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';

interface GetSessionResponse {
  user?: { id: string } | null;
}

const accountsJwtPayloadSchema = z.object({ sub: z.string() });

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(accountsUrl: string): ReturnType<typeof createRemoteJWKSet> {
  const existing = jwksCache.get(accountsUrl);
  if (existing) return existing;

  const jwks = createRemoteJWKSet(new URL('/api/auth/jwks', accountsUrl));
  jwksCache.set(accountsUrl, jwks);
  return jwks;
}

/**
 * Verifies the caller's `Authorization: Bearer` JWT against
 * accounts.karasu256.com's JWKS — an alternative to {@link requireUid} for
 * callers whose own server can't rely on the `Cookie` header reaching it
 * (see `SessionProvider` in `@Hashibutogarasu/ui`, which mints this JWT as
 * the single source of truth for "who is logged in"). Returns the token's
 * subject (the user id), or null when the header is missing, the token is
 * expired, or signature verification fails.
 */
export async function verifyAccountsJwt(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwks(env.ACCOUNTS_URL));
    return accountsJwtPayloadSchema.parse(payload).sub;
  } catch {
    return null;
  }
}

/**
 * Verifies the caller's session by forwarding their `Cookie` header
 * verbatim to accounts.karasu256.com's `GET /api/auth/get-session` — this
 * Worker holds no Firebase or better-auth credentials of its own, so a
 * remote check against the monorepo's single auth instance is how it learns
 * "who is logged in". No cookie name is inspected or reconstructed here, so
 * this keeps working regardless of what better-auth names its session
 * cookie in a given environment (e.g. the `__Secure-` prefix under HTTPS).
 *
 * Returns the caller's uid, or null when the cookie is missing or invalid.
 */
export async function requireUid(request: Request, env: Env): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  try {
    const res = await fetch(`${env.ACCOUNTS_URL}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GetSessionResponse;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
