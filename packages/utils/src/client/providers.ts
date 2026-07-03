import { ApiError } from './api-error';

export interface ProviderProfile {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

/**
 * Returns the third-party providers linked to the current user, keyed by
 * provider ID.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function listLinkedProviders(): Promise<Record<string, ProviderProfile>> {
  const res = await fetch('/api/users/me/providers');
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<Record<string, ProviderProfile>>;
}

/**
 * Returns the current user's profile for a single linked provider.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function getProviderDetails(providerId: string): Promise<ProviderProfile> {
  const res = await fetch(`/api/users/me/providers/${encodeURIComponent(providerId)}/details`);
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<ProviderProfile>;
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
