import { BETTER_AUTH_SESSION_COOKIE_NAME } from '../constants/session';

export interface UploadImageOptions {
  /** Base URL of the image API, e.g. `https://cdn.karasu256.com`. */
  imageApiUrl: string;
  /** Raw value of the caller's better-auth session cookie, forwarded to authenticate the upload. */
  sessionCookie: string;
  /** Explicit storage key (e.g. `users/{uid}/avatar.png`). When omitted, the server generates one. */
  path?: string;
}

export type UploadImageResult = { ok: true; status: number; url: string } | { ok: false; status: number; error?: string };

/**
 * Uploads a file to the image API on behalf of an authenticated caller,
 * forwarding the session cookie for server-to-server auth.
 */
export async function uploadImage(file: File, options: UploadImageOptions): Promise<UploadImageResult> {
  const form = new FormData();
  form.append('file', file);
  if (options.path) form.append('path', options.path);

  const res = await fetch(`${options.imageApiUrl}/upload`, {
    method: 'POST',
    body: form,
    headers: { Cookie: `${BETTER_AUTH_SESSION_COOKIE_NAME}=${options.sessionCookie}` },
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    return { ok: false, status: res.status, error: body.error };
  }
  const { url } = (await res.json()) as { url: string };
  return { ok: true, status: res.status, url };
}
