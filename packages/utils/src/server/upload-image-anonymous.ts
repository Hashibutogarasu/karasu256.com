export interface UploadImageAnonymousOptions {
  /** Base URL of the image API, e.g. `https://cdn.karasu256.com`. */
  apiUrl: string;
  /** Explicit storage key the caller wants to upload to (e.g. `qr/anonymous/{datetime}.png`). */
  path: string;
  /** MIME type of the file being uploaded. */
  contentType: string;
}

export type UploadImageAnonymousResult = { ok: true; url: string } | { ok: false; status: number; error?: string };

/**
 * Uploads a file to the image API's unauthenticated `/upload/anonymous`
 * endpoint, for callers with no Firebase session to forward (e.g. an
 * anonymous visitor). The image API restricts this endpoint to a fixed
 * path scheme and applies a per-IP rate limit.
 */
export async function uploadImageAnonymous(buffer: Buffer, options: UploadImageAnonymousOptions): Promise<UploadImageAnonymousResult> {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: options.contentType }), 'upload');
  form.append('path', options.path);

  const res = await fetch(`${options.apiUrl}/upload/anonymous`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    return { ok: false, status: res.status, error: body.error };
  }
  const { url } = (await res.json()) as { url: string };
  return { ok: true, status: res.status, url };
}
