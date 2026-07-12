const BETTER_AUTH_SESSION_COOKIE_NAME = 'better_auth_session';

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header
      .split(';')
      .map((c) => c.trim().split('=', 2) as [string, string])
      .filter(([k]) => k.length > 0)
      .map(([k, v]) => [k.trim(), decodeURIComponent((v ?? '').trim())])
  );
}

interface GetSessionResponse {
  user?: { id: string } | null;
}

/**
 * Verifies the caller's session by forwarding their better-auth session
 * cookie to accounts.karasu256.com's `GET /api/auth/get-session` — this
 * Worker holds no Firebase or better-auth credentials of its own, so a
 * remote check against the monorepo's single auth instance is how it learns
 * "who is logged in".
 *
 * Returns the caller's uid, or null when the cookie is missing or invalid.
 */
export async function requireUid(request: Request, env: Env): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies[BETTER_AUTH_SESSION_COOKIE_NAME];
  if (!sessionCookie) return null;

  try {
    const res = await fetch(`${env.ACCOUNTS_URL}/api/auth/get-session`, {
      headers: { cookie: `${BETTER_AUTH_SESSION_COOKIE_NAME}=${sessionCookie}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GetSessionResponse;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
