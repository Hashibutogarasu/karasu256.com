import { ApiError } from './api-error';

/**
 * Uploads the given file as the authenticated user's icon.
 *
 * @returns The new Firebase Auth `photoURL`.
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function uploadUserIcon(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/user/icon', { method: 'POST', body: form });
  if (!res.ok) throw ApiError.fromResponse(res);
  const { photoURL } = (await res.json()) as { photoURL: string };
  return photoURL;
}

/**
 * Sets the authenticated user's icon to the given linked provider's avatar.
 *
 * @returns The new Firebase Auth `photoURL`.
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function setUserIconFromProvider(providerId: string): Promise<string> {
  const res = await fetch('/api/user/icon', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
  const { photoURL } = (await res.json()) as { photoURL: string };
  return photoURL;
}

/**
 * Clears the authenticated user's icon.
 *
 * @throws {ApiError} When the request fails with a non-ok HTTP status.
 */
export async function deleteUserIcon(): Promise<void> {
  const res = await fetch('/api/user/icon', { method: 'DELETE' });
  if (!res.ok) throw ApiError.fromResponse(res);
}
