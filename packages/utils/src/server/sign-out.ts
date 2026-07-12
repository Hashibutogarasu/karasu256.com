'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { parseSetCookieHeader, toCookieOptions } from 'better-auth/cookies';
import { SESSION_COOKIE_NAME } from '../constants/session';

/**
 * Ends the better-auth session — the session every app now trusts for "who
 * is logged in" — by forwarding this request's cookies to
 * accounts.karasu256.com's `/api/auth/sign-out` and replaying the resulting
 * `Set-Cookie`s onto the local cookie store. Errors are swallowed: signing
 * out of the (legacy) Firebase cookie below must still proceed even if the
 * accounts app is unreachable.
 */
async function endBetterAuthSession(accountsUrl: string, store: Awaited<ReturnType<typeof cookies>>): Promise<void> {
  try {
    const cookieHeader = store
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
    const res = await fetch(`${accountsUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: { cookie: cookieHeader },
    });
    for (const setCookie of res.headers.getSetCookie()) {
      for (const [name, attributes] of parseSetCookieHeader(setCookie)) {
        store.set(name, attributes.value, toCookieOptions(attributes));
      }
    }
  } catch {}
}

/**
 * Ends the better-auth session and clears the (legacy) Firebase session
 * cookie, then redirects to the accounts portal's sign-out page. Shared
 * across apps so every subdomain signs out the same way.
 */
export async function signOutAction(): Promise<void> {
  const store = await cookies();
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? '';

  if (accountsUrl) {
    await endBetterAuthSession(accountsUrl, store);
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const next = appUrl ? `?next=${encodeURIComponent(appUrl)}` : '';
  redirect(`${accountsUrl}/signout${next}`);
}
