import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { vercelProtectionBypassHeaders } from './vercel-bypass';

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(accountsUrl: string, protectionBypassSecret: string | undefined): ReturnType<typeof createRemoteJWKSet> {
  const existing = jwksCache.get(accountsUrl);
  if (existing) return existing;

  const jwks = createRemoteJWKSet(new URL('/api/auth/jwks', accountsUrl), {
    headers: vercelProtectionBypassHeaders(protectionBypassSecret),
  });
  jwksCache.set(accountsUrl, jwks);
  return jwks;
}

/**
 * Verifies a bearer JWT minted by accounts.karasu256.com's better-auth
 * instance (its `jwt` plugin's `GET /api/auth/token` endpoint), returning
 * the token's subject (the user id) or null when the token is missing,
 * expired, or fails signature verification.
 *
 * Exists for callers that can't rely on `getSessionUser`'s `Cookie`-header
 * forwarding, e.g. a same-origin request to an app whose server never
 * receives accounts.karasu256.com's session cookie in the first place
 * (independent of a browser tab's own direct, credentialed calls to
 * accounts.karasu256.com, which always see that cookie regardless of the
 * calling app's own origin).
 *
 * `accountsUrl` and `protectionBypassSecret` are supplied by the caller
 * (e.g. from its own environment variables) rather than read here, since
 * this package doesn't read environment variables itself.
 * `protectionBypassSecret`, when given, is sent as
 * `x-vercel-protection-bypass` so this JWKS fetch reaches
 * accounts.karasu256.com even when its deployment has Vercel Deployment
 * Protection enabled (e.g. a protected Preview).
 */
export async function verifyAppJwt(token: string, accountsUrl: string | undefined, protectionBypassSecret?: string): Promise<string | null> {
  if (!accountsUrl) {
    console.error(JSON.stringify({ event: 'verify_app_jwt', result: 'failure', reason: 'missing_accounts_url' }));
    return null;
  }

  try {
    const { payload }: { payload: JWTPayload } = await jwtVerify(token, getJwks(accountsUrl, protectionBypassSecret));
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!sub) {
      console.error(JSON.stringify({ event: 'verify_app_jwt', result: 'failure', reason: 'missing_sub_claim' }));
      return null;
    }
    console.log(JSON.stringify({ event: 'verify_app_jwt', result: 'success', uid: sub }));
    return sub;
  } catch (err) {
    console.error(JSON.stringify({ event: 'verify_app_jwt', result: 'failure', error: err instanceof Error ? err.message : String(err) }));
    return null;
  }
}
