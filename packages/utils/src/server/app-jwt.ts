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
 * `protectionBypassSecret`, when given, is sent as
 * `x-vercel-protection-bypass` so this JWKS fetch reaches
 * accounts.karasu256.com even when its deployment has Vercel Deployment
 * Protection enabled (e.g. a protected Preview) — the caller is
 * responsible for supplying it, since this package doesn't read
 * environment variables itself.
 */
export async function verifyAppJwt(token: string, protectionBypassSecret?: string): Promise<string | null> {
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;
  if (!accountsUrl) return null;

  try {
    const { payload }: { payload: JWTPayload } = await jwtVerify(token, getJwks(accountsUrl, protectionBypassSecret));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
