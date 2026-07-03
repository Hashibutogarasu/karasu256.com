import { ApiError } from '@Hashibutogarasu/utils/client';

export interface AuthorizedAppSummary {
  clientId: string;
  name: string;
  iconUrl: string | null;
  permissions: number;
  lastUsedAt: string | null;
}

/**
 * Returns all OAuth clients with active tokens for the current user.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function listAuthorizedApps(): Promise<AuthorizedAppSummary[]> {
  const res = await fetch('/api/oauth/authorized-apps');
  if (!res.ok) throw ApiError.fromResponse(res);
  return res.json() as Promise<AuthorizedAppSummary[]>;
}

/**
 * Revokes all active tokens the current user has granted to the given client.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function revokeAuthorizedApp(clientId: string): Promise<void> {
  const res = await fetch(`/api/oauth/authorized-apps/${clientId}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw ApiError.fromResponse(res);
}
