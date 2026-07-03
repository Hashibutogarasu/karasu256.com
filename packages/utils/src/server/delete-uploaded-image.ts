import { SESSION_COOKIE_NAME } from './next-auth';

export interface DeleteUploadedImageOptions {
  /** Base URL of the image API, e.g. `https://cdn.karasu256.com`. */
  imageApiUrl: string;
  /** Raw value of the caller's session cookie, forwarded to authenticate the delete. */
  sessionCookie: string;
}

/**
 * Deletes a previously uploaded image from the image API, given its full
 * public URL. Used to clean up a user's or OAuth client's old icon once a
 * new one has replaced it.
 *
 * No-ops when `iconUrl` is null or doesn't point at `imageApiUrl` (e.g. a
 * externally hosted icon), and swallows delete failures since this is
 * best-effort cleanup that must never block the caller's primary update.
 */
export async function deleteUploadedImage(iconUrl: string | null, options: DeleteUploadedImageOptions): Promise<void> {
  if (!iconUrl) return;

  try {
    const url = new URL(iconUrl);
    if (url.origin !== new URL(options.imageApiUrl).origin) return;
    const key = url.pathname.slice(1);
    if (!key) return;

    await fetch(`${options.imageApiUrl}/${key}`, {
      method: 'DELETE',
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${options.sessionCookie}` },
    });
  } catch {
    return;
  }
}
