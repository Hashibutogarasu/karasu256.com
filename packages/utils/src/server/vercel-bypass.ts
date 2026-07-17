/**
 * Builds the `x-vercel-protection-bypass` header, needed on server-to-server
 * requests to any deployment that has Vercel Deployment Protection (e.g.
 * Vercel Authentication on a Preview deployment) enabled — otherwise the
 * request gets redirected to a Vercel SSO challenge instead of reaching the
 * app. Returns an empty object when `secret` is undefined (e.g. the target
 * deployment isn't protected, such as production), so callers can spread
 * this unconditionally into their own headers.
 */
export function vercelProtectionBypassHeaders(secret: string | undefined): Record<string, string> {
  return secret ? { 'x-vercel-protection-bypass': secret } : {};
}
