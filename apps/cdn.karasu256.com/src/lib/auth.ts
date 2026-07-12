interface GetSessionResponse {
  user?: { id: string } | null;
}

/**
 * Verifies the caller's session by forwarding their `Cookie` header
 * verbatim to accounts.karasu256.com's `GET /api/auth/get-session` — this
 * Worker holds no Firebase or better-auth credentials of its own, so a
 * remote check against the monorepo's single auth instance is how it learns
 * "who is logged in". No cookie name is inspected or reconstructed here, so
 * this keeps working regardless of what better-auth names its session
 * cookie in a given environment (e.g. the `__Secure-` prefix under HTTPS).
 *
 * Returns the caller's uid, or null when the cookie is missing or invalid.
 */
export async function requireUid(request: Request, env: Env): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  try {
    const res = await fetch(`${env.ACCOUNTS_URL}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GetSessionResponse;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
