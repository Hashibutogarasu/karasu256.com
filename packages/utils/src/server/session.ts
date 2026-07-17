import { headers } from 'next/headers';
import { getSessionCookie } from 'better-auth/cookies';
import { vercelProtectionBypassHeaders } from './vercel-bypass';

/** The subset of better-auth's `user` model that callers across apps rely on. */
export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

interface GetSessionResponse {
  user?: { id: string; email?: string | null; name?: string | null; image?: string | null } | null;
}

/**
 * Reads and verifies the current session by forwarding this request's
 * headers to accounts.karasu256.com's better-auth instance
 * (`GET /api/auth/get-session`), the monorepo's single source of truth for
 * "who is logged in". Returns `null` when signed out, the accounts app is
 * unreachable, or `NEXT_PUBLIC_ACCOUNTS_URL` isn't configured.
 *
 * Calling apps never hold Firebase credentials of their own — this remote
 * check is what lets them verify sessions without one. `getSessionCookie`
 * only checks the cookie's presence (accounting for the `__Secure-` prefix
 * better-auth adds under HTTPS/production) to skip the network round trip
 * when signed out; it never inspects individual cookie names for the
 * forwarded request. `protectionBypassSecret`, when given, is sent as
 * `x-vercel-protection-bypass` so this request reaches
 * accounts.karasu256.com even when its deployment has Vercel Deployment
 * Protection enabled (e.g. a protected Preview) — the caller is
 * responsible for supplying it, since this package doesn't read
 * environment variables itself.
 */
export async function getSessionUser(protectionBypassSecret?: string): Promise<SessionUser | null> {
  const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL;
  if (!accountsUrl) return null;

  const requestHeaders = await headers();
  if (!getSessionCookie(requestHeaders)) return null;

  try {
    const res = await fetch(`${accountsUrl}/api/auth/get-session`, {
      headers: { cookie: requestHeaders.get('cookie') ?? '', ...vercelProtectionBypassHeaders(protectionBypassSecret) },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = (await res.json()) as GetSessionResponse;
    if (!data.user) return null;

    return {
      uid: data.user.id,
      email: data.user.email ?? null,
      name: data.user.name ?? null,
      image: data.user.image ?? null,
    };
  } catch {
    return null;
  }
}
