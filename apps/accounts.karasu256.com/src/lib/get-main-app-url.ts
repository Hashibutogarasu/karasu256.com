/**
 * Derives the main app's origin from the server-only `ROOT_DOMAIN`
 * environment variable. Returns `undefined` when `ROOT_DOMAIN` is unset, in
 * which case the settings sidebar's "back to app" link is simply omitted.
 */
export function getMainAppUrlFromRootDomain(): string | undefined {
  const rootDomain = process.env.ROOT_DOMAIN;
  return rootDomain ? `https://${rootDomain}` : undefined;
}
