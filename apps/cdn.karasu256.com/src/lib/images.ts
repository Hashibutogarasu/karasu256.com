/**
 * Serves a previously uploaded image from R2 by its object key, so that the
 * URL returned from `/upload` is actually loadable (e.g. as an `<img>` src).
 */
export async function serveImage(pathname: string, env: Env): Promise<Response> {
  const key = pathname.slice(1);
  if (!key) {
    return new Response('Not Found', { status: 404 });
  }

  const object = await env.IMAGES.get(key);
  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, { headers });
}

export async function deleteImage(key: string, env: Env): Promise<void> {
  await env.IMAGES.delete(key);
}

export async function putImage(key: string, buffer: ArrayBuffer, contentType: string, env: Env): Promise<void> {
  await env.IMAGES.put(key, buffer, {
    httpMetadata: { contentType },
  });
}
