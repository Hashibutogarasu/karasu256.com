import { apiFetch } from './api-fetch';

export interface UploadImageOptions {
  /** Base URL of the image API, e.g. `https://cdn.karasu256.com`. */
  imageApiUrl: string;
  /** The caller's raw `Cookie` request header, forwarded verbatim to authenticate the upload. Ignored when `token` is given. */
  cookieHeader?: string | null;
  /**
   * JWT proving the caller's session (see `verifyAppJwt`), preferred over
   * `cookieHeader` since it doesn't depend on the cookie reaching this
   * app's own server. Exchanged for a short-lived, `path`-scoped upload
   * ticket via `POST {imageApiUrl}/upload/ticket` before the actual
   * upload, so `path` is required when this is given.
   */
  token?: string | null;
  /** Explicit storage key (e.g. `users/{uid}/avatar.png`). When omitted, the server generates one. Required when authenticating with `token`. */
  path?: string;
}

export type UploadImageResult = { ok: true; status: number; url: string } | { ok: false; status: number; error?: string };

type AuthHeaderResult = { ok: true; headers: HeadersInit } | { ok: false; status: number; error: string };

async function resolveAuthHeader(options: UploadImageOptions): Promise<AuthHeaderResult> {
  if (options.token) {
    if (!options.path) return { ok: false, status: 400, error: 'uploadImage: path is required when authenticating with token' };

    const ticketRes = await apiFetch(`${options.imageApiUrl}/upload/ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: options.path }),
      token: options.token,
    });
    if (!ticketRes.ok) return { ok: false, status: ticketRes.status, error: 'Failed to obtain upload ticket' };

    const { ticket } = (await ticketRes.json()) as { ticket: string };
    return { ok: true, headers: { Authorization: `Bearer ${ticket}` } };
  }

  if (options.cookieHeader) return { ok: true, headers: { Cookie: options.cookieHeader } };

  return { ok: false, status: 401, error: 'uploadImage: cookieHeader or token is required' };
}

/**
 * Uploads a file to the image API on behalf of an authenticated caller.
 */
export async function uploadImage(file: File, options: UploadImageOptions): Promise<UploadImageResult> {
  const auth = await resolveAuthHeader(options);
  if (!auth.ok) return auth;

  const form = new FormData();
  form.append('file', file);
  if (options.path) form.append('path', options.path);

  const res = await fetch(`${options.imageApiUrl}/upload`, {
    method: 'POST',
    body: form,
    headers: auth.headers,
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    return { ok: false, status: res.status, error: body.error };
  }
  const { url } = (await res.json()) as { url: string };
  return { ok: true, status: res.status, url };
}
