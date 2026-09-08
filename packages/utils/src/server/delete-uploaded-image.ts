import { apiFetch } from './api-fetch';

export interface DeleteUploadedImageOptions {
  /** Base URL of the image API, e.g. `https://cdn.karasu256.com`. */
  imageApiUrl: string;
  /** The caller's raw `Cookie` request header, forwarded verbatim to authenticate the delete. Ignored when `token` is given. */
  cookieHeader?: string | null;
  /** JWT proving the caller's session (see `verifyAppJwt`), preferred over `cookieHeader` since it doesn't depend on the cookie reaching this app's own server. */
  token?: string | null;
}

/**
 * Deletes a previously uploaded image from the image API, given its full
 * public URL. Used to clean up a user's or OAuth client's old icon once a
 * new one has replaced it.
 *
 * No-ops when `iconUrl` is null, doesn't point at `imageApiUrl` (e.g. a
 * externally hosted icon), or neither `token` nor `cookieHeader` was
 * given, and swallows delete failures since this is best-effort cleanup
 * that must never block the caller's primary update.
 */
export async function deleteUploadedImage(iconUrl: string | null, options: DeleteUploadedImageOptions): Promise<void> {
  if (!iconUrl) return;

  try {
    const url = new URL(iconUrl);
    if (url.origin !== new URL(options.imageApiUrl).origin) return;
    const key = url.pathname.slice(1);
    if (!key) return;

    if (options.token) {
      await apiFetch(`${options.imageApiUrl}/${key}`, { method: 'DELETE', token: options.token });
    } else if (options.cookieHeader) {
      await apiFetch(`${options.imageApiUrl}/${key}`, { method: 'DELETE', headers: { Cookie: options.cookieHeader } });
    }
  } catch {
    return;
  }
}
