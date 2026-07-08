import { z } from 'zod';

/**
 * Reduces a hostname to its root domain by keeping only the last two
 * dot-separated labels — e.g. `dev.accounts.karasu256.com` → `karasu256.com`
 * — regardless of how many subdomain levels precede it, so the accounts app
 * never needs to know its own subdomain label to find its sibling app.
 */
const rootDomainSchema = z
  .string()
  .min(1)
  .transform((hostname) => hostname.split('.').slice(-2).join('.'))
  .pipe(z.string().min(1));

/**
 * Derives the main app's origin from the current browser location's root
 * domain, so the settings sidebar's "back to app" link works for any
 * hostname (production, any preview environment, ...) without depending on
 * `NEXT_PUBLIC_APP_URL` being configured correctly per deployment
 * environment. Only ever called client-side (from a `useEffect`), so there
 * is no server-rendering case to guard against.
 */
export function getMainAppUrl(): string {
  const { protocol, hostname, port } = window.location;
  const rootDomain = rootDomainSchema.parse(hostname);
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${rootDomain}${portSuffix}`;
}
