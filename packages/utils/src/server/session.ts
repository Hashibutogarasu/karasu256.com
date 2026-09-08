import { headers } from 'next/headers';
import { getSessionCookie } from 'better-auth/cookies';
import { vercelProtectionBypassHeaders } from './vercel-bypass';
import { logError, logInfo } from './log';

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
 * unreachable, or `accountsUrl` isn't given.
 *
 * Calling apps never hold Firebase credentials of their own — this remote
 * check is what lets them verify sessions without one. `getSessionCookie`
 * only checks the cookie's presence (accounting for the `__Secure-` prefix
 * better-auth adds under HTTPS/production) to skip the network round trip
 * when signed out; it never inspects individual cookie names for the
 * forwarded request.
 *
 * `accountsUrl` and `protectionBypassSecret` are supplied by the caller
 * (e.g. from its own environment variables) rather than read here, since
 * this package doesn't read environment variables itself.
 * `protectionBypassSecret`, when given, is sent as
 * `x-vercel-protection-bypass` so this request reaches
 * accounts.karasu256.com even when its deployment has Vercel Deployment
 * Protection enabled (e.g. a protected Preview).
 */
export async function getSessionUser(accountsUrl: string | undefined, protectionBypassSecret?: string): Promise<SessionUser | null> {
  if (!accountsUrl) {
    logInfo('get_session_user', { result: 'skipped', reason: 'missing_accounts_url' });
    return null;
  }

  const requestHeaders = await headers();
  if (!getSessionCookie(requestHeaders)) {
    logInfo('get_session_user', { result: 'skipped', reason: 'no_session_cookie' });
    return null;
  }

  const url = `${accountsUrl}/api/auth/get-session`;
  try {
    const res = await fetch(url, {
      headers: { cookie: requestHeaders.get('cookie') ?? '', ...vercelProtectionBypassHeaders(protectionBypassSecret) },
      cache: 'no-store',
    });
    if (!res.ok) {
      logError('get_session_user', { result: 'failure', url, status: res.status });
      return null;
    }

    const data = (await res.json()) as GetSessionResponse;
    if (!data.user) {
      logError('get_session_user', { result: 'no_session' });
      return null;
    }

    logInfo('get_session_user', { result: 'success', uid: data.user.id });
    return {
      uid: data.user.id,
      email: data.user.email ?? null,
      name: data.user.name ?? null,
      image: data.user.image ?? null,
    };
  } catch (err) {
    logError('get_session_user', { result: 'error', url, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
