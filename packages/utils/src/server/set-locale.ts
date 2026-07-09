'use server';

import { cookies } from 'next/headers';

/**
 * Persists the user's locale choice as the `NEXT_LOCALE` cookie next-intl
 * reads on every request. Scoped to `.{BASE_DOMAIN}` when set, so switching
 * language on one app carries over to every other subdomain sharing the
 * same session.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  const store = await cookies();
  const domain = process.env.BASE_DOMAIN ? `.${process.env.BASE_DOMAIN}` : undefined;

  store.set({
    name: 'NEXT_LOCALE',
    value: locale,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge: 60 * 60 * 24 * 365,
  });
}
