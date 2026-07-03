'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME, AUTH_TOKEN_COOKIE_NAME } from '@Hashibutogarasu/utils/server';

/**
 * Clears the Firebase session cookie and the NextAuth JWT, then redirects to
 * the home page.
 */
export async function signOutAction() {
  const store = await cookies();
  const domain = process.env.BASE_DOMAIN ? `.${process.env.BASE_DOMAIN}` : undefined;
  const secure = process.env.NODE_ENV === 'production';

  store.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge: 0,
  });

  store.set({
    name: AUTH_TOKEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge: 0,
  });

  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const next = appUrl ? `?next=${encodeURIComponent(appUrl)}` : '';
  redirect(`${accountsUrl}/signout${next}`);
}
