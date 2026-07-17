/**
 * Updates the JWT `apiFetch` attaches automatically. Called by
 * `SessionProvider` (`@Hashibutogarasu/ui`) whenever its session state
 * changes. Backed by `sessionStorage` (scoped to this tab) rather than a
 * module-level variable, so it can't go stale across bundled copies of
 * this module.
 */
export function setSessionToken(token: string | null): void {
  if (token) sessionStorage.setItem('app-jwt', token);
  else sessionStorage.removeItem('app-jwt');
}

export interface ApiFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit;
  /**
   * JWT to attach as `Authorization: Bearer <token>`. Defaults to the token
   * most recently reported via `setSessionToken`, so callers inside a
   * `SessionProvider` never need to look it up themselves. Pass `null`
   * explicitly to send the request without one.
   */
  token?: string | null;
}

/**
 * Wraps `fetch`, attaching `Authorization: Bearer <token>` when a token is
 * available. Apps calling another app's API from client code should use
 * this instead of `fetch` directly, so a call site can never accidentally
 * send an unauthenticated request by forgetting to format the header
 * itself.
 */
export async function apiFetch(
  input: string | URL,
  { token = sessionStorage.getItem('app-jwt'), headers, ...rest }: ApiFetchOptions = {}
): Promise<Response> {
  return fetch(input, {
    ...rest,
    headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
  });
}
