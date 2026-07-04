import { ApiError } from './api-error';

/**
 * Returns the third-party provider IDs linked to the current user.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function listLinkedProviders(): Promise<string[]> {
  const res = await fetch('/api/users/me/providers');
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<string[]>;
}

/**
 * Unlinks the given provider from the current user's account.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function unlinkProvider(providerId: string): Promise<void> {
  const res = await fetch(`/api/users/me/providers/${encodeURIComponent(providerId)}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204) throw ApiError.fromResponse(res);
}
