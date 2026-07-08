/**
 * Derives the main karasu256.com app's origin from the current browser
 * location, by stripping the `accounts.` label from the hostname — e.g.
 * `accounts.karasu256.com` → `karasu256.com`, `dev.accounts.karasu256.com` →
 * `dev.karasu256.com`. Avoids depending on `NEXT_PUBLIC_APP_URL` being
 * correctly configured per-environment for the "back to app" link.
 *
 * Returns `undefined` when there is no `accounts.` label to strip (e.g.
 * local development, where the main app runs on a different port instead of
 * a different subdomain) or when called outside the browser.
 */
export function getMainAppUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const { protocol, hostname, port } = window.location;
  if (!/(^|\.)accounts\./.test(hostname)) return undefined;

  const mainHostname = hostname.replace(/(^|\.)accounts\./, '$1');
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${mainHostname}${portSuffix}`;
}
