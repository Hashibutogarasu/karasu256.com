import { createRemoteJWKSet, customFetch, jwtVerify } from 'jose';
import { z } from 'zod';
import { logError, logInfo } from '@Hashibutogarasu/utils/server/log';
import { vercelProtectionBypassHeaders } from '@Hashibutogarasu/utils/server/vercel-bypass';

interface GetSessionResponse {
  user?: { id: string } | null;
}

const accountsJwtPayloadSchema = z.object({ sub: z.string() });

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * jose fetches the JWKS with `redirect: 'manual'`, so a Vercel Deployment
 * Protection redirect surfaces only as a generic "Expected 200 OK" error
 * with no further detail. This `customFetch` logs the raw response
 * (status/type/body preview) and whether a bypass header was actually
 * attached, so a redirect- or protection-caused failure is distinguishable
 * from every other one.
 */
function getJwks(env: Env): ReturnType<typeof createRemoteJWKSet> {
  const existing = jwksCache.get(env.ACCOUNTS_URL);
  if (existing) return existing;

  const jwks = createRemoteJWKSet(new URL('/api/auth/jwks', env.ACCOUNTS_URL), {
    headers: vercelProtectionBypassHeaders(env.VERCEL_PROTECTION_BYPASS_SECRET),
    [customFetch]: async (url, options) => {
      const res = await fetch(url, options);
      const bodyPreview =
        res.status === 200
          ? undefined
          : await res
              .clone()
              .text()
              .then((text) => text.slice(0, 500))
              .catch(() => undefined);
      logInfo('fetch_jwks', {
        url,
        status: res.status,
        type: res.type,
        hadBypassSecret: Boolean(env.VERCEL_PROTECTION_BYPASS_SECRET),
        server: res.headers.get('server'),
        vercelId: res.headers.get('x-vercel-id'),
        bodyPreview,
      });
      return res;
    },
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
    const sub = accountsJwtPayloadSchema.parse(payload).sub;
    logInfo('verify_accounts_jwt', { result: 'success', uid: sub });
    return sub;
  } catch (err) {
    logError('verify_accounts_jwt', { result: 'failure', error: err instanceof Error ? err.message : String(err) });
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

  const url = `${env.ACCOUNTS_URL}/api/auth/get-session`;
  try {
    const res = await fetch(url, {
      headers: { cookie: cookieHeader, ...vercelProtectionBypassHeaders(env.VERCEL_PROTECTION_BYPASS_SECRET) },
    });
    if (!res.ok) {
      logError('require_uid', { result: 'failure', url, status: res.status });
      return null;
    }
    const data = (await res.json()) as GetSessionResponse;
    if (!data.user) {
      logError('require_uid', { result: 'no_session' });
      return null;
    }
    logInfo('require_uid', { result: 'success', uid: data.user.id });
    return data.user.id;
  } catch (err) {
    logError('require_uid', { result: 'error', url, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
