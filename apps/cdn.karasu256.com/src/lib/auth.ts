import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';

interface GetSessionResponse {
  user?: { id: string } | null;
}

const accountsJwtPayloadSchema = z.object({ sub: z.string() });

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Builds the `x-vercel-protection-bypass` header, needed on server-to-server
 * requests to any deployment that has Vercel Deployment Protection (e.g.
 * Vercel Authentication on a Preview deployment) enabled — otherwise the
 * request gets redirected to a Vercel SSO challenge instead of reaching the
 * app. Returns an empty object when `secret` is undefined (e.g. the target
 * deployment isn't protected, such as production).
 */
function vercelProtectionBypassHeaders(secret: string | undefined): Record<string, string> {
  return secret ? { 'x-vercel-protection-bypass': secret } : {};
}

function getJwks(env: Env): ReturnType<typeof createRemoteJWKSet> {
  const existing = jwksCache.get(env.ACCOUNTS_URL);
  if (existing) return existing;

  const jwks = createRemoteJWKSet(new URL('/api/auth/jwks', env.ACCOUNTS_URL), {
    headers: vercelProtectionBypassHeaders(env.VERCEL_PROTECTION_BYPASS_SECRET),
  });
  jwksCache.set(env.ACCOUNTS_URL, jwks);
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
    const { payload } = await jwtVerify(authHeader.slice(7), getJwks(env));
    return accountsJwtPayloadSchema.parse(payload).sub;
  } catch {
    return null;
  }
}

/**
 * Verifies the caller's `Authorization: Bearer` header against
 * `env.CRON_JOBS_API_KEY`, identifying the `cron-jobs` worker as a trusted
 * service caller (its scheduled cleanup has no user session to prove, so
 * `verifyAccountsJwt`/`requireUid` don't apply). Returns whether the
 * caller is trusted.
 */
export function verifyCronJobsKey(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  return authHeader.slice(7) === env.CRON_JOBS_API_KEY;
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
      headers: { cookie: cookieHeader, ...vercelProtectionBypassHeaders(env.VERCEL_PROTECTION_BYPASS_SECRET) },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GetSessionResponse;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
