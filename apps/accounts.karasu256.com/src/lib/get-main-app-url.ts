/**
 * Derives the main app's origin from the server-only `BASE_DOMAIN`
 * environment variable, the same variable already used to scope
 * cross-subdomain session cookies (see `signOutAction` and
 * `auth-options.ts`). Returns `undefined` when `BASE_DOMAIN` is unset, in
 * which case the settings sidebar's "back to app" link is simply omitted.
 */
export function getMainAppUrlFromBaseDomain(): string | undefined {
  const baseDomain = process.env.BASE_DOMAIN;
  return baseDomain ? `https://${baseDomain}` : undefined;
}
