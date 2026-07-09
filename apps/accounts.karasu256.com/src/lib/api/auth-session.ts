import { ApiError } from '@Hashibutogarasu/utils/client';

/**
 * Creates a server-side session cookie from a Firebase ID token.
 *
 * @throws {ApiError} When the server rejects the token.
 */
export async function createSession(idToken: string): Promise<void> {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
}

/** Clears the server-side session cookie. */
export async function clearSession(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

/**
 * Requests a fresh Firebase custom token for the still-valid server session,
 * so the caller can restore client-side Firebase Auth state that was lost
 * independently of the server session cookie.
 *
 * @returns The custom token, or `null` when the server has no active session.
 */
export async function resyncSession(): Promise<string | null> {
  const res = await fetch('/api/auth/resync', { method: 'POST' });
  if (!res.ok) return null;
  const { customToken } = (await res.json()) as { customToken: string };
  return customToken;
}
