import { apiFetch } from './api-fetch';

export interface UploadImageOptions {
  /** Base URL of the image API, e.g. `https://cdn.karasu256.com`. */
  apiUrl: string;
  /** Explicit storage key (e.g. `users/{uid}/avatar.png`). When omitted, the server generates one. */
  path?: string;
}

/**
 * Uploads a file to the image API from the browser and resolves with its
 * public URL, or `null` if the upload failed for any reason, including a
 * network or CORS error. Authenticates with the current session's JWT (see
 * `apiFetch`) rather than `credentials: 'include'` alone, since the image
 * API's own server can't rely on a cross-subdomain session cookie reaching
 * it.
 */
export async function uploadImage(file: File, options: UploadImageOptions): Promise<string | null> {
  const form = new FormData();
  form.append('file', file);
  if (options.path) form.append('path', options.path);
  try {
    const res = await apiFetch(`${options.apiUrl}/upload`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    if (!res.ok) return null;
    const { url } = (await res.json()) as { url: string };
    return url;
  } catch {
    return null;
  }
}
