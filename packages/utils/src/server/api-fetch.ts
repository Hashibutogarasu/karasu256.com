export interface ApiFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit;
  /** JWT to attach as `Authorization: Bearer <token>`. Omitted entirely when null or undefined. */
  token?: string | null;
}

/**
 * Wraps `fetch` for server-to-server calls to another app's API, attaching
 * `Authorization: Bearer <token>` when `token` is given. Use this instead
 * of `fetch` directly for any authenticated cross-app call made from
 * server code, so a call site can never accidentally send an
 * unauthenticated request by forgetting to format the header itself.
 */
export async function apiFetch(input: string | URL, options: ApiFetchOptions = {}): Promise<Response> {
  const { token, headers, ...rest } = options;
  return fetch(input, {
    ...rest,
    headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
  });
}
