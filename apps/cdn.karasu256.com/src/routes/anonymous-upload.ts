import { Elysia, t } from 'elysia';
import { checkAndIncrementRateLimit } from '../lib/rate-limit';
import { ALLOWED_TYPES, MAX_FILE_BYTES, isValidAnonymousUploadPath } from '../lib/uploads';
import { putImage } from '../lib/images';

const anonymousUploadBodySchema = t.Object({
  file: t.Optional(t.File()),
  path: t.Optional(t.String()),
});

/**
 * Handles unauthenticated uploads restricted to the `qr/anonymous/{datetime}.png`
 * path scheme, rate-limited per IP since there is no uid to scope abuse to.
 */
export const anonymousUploadRoute = (env: Env) =>
  new Elysia().post(
    '/upload/anonymous',
    async ({ request, body, set }) => {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) {
        set.status = 400;
        return { error: 'Bad Request' };
      }

      const allowed = await checkAndIncrementRateLimit(ip, env);
      if (!allowed) {
        set.status = 429;
        set.headers['Retry-After'] = '3600';
        return { error: 'Rate limit exceeded' };
      }

      if (!body.file) {
        set.status = 400;
        return { error: 'Missing file field' };
      }

      const path = body.path ?? null;
      if (!path || !isValidAnonymousUploadPath(path)) {
        set.status = 400;
        return { error: 'Invalid upload path' };
      }

      if (!ALLOWED_TYPES.has(body.file.type)) {
        set.status = 400;
        return { error: 'Unsupported image type. Allowed: jpeg, png, webp.' };
      }

      const buffer = await body.file.arrayBuffer();
      if (buffer.byteLength > MAX_FILE_BYTES) {
        set.status = 413;
        return { error: 'File exceeds 5 MB limit' };
      }

      await putImage(path, buffer, body.file.type, env);

      return { url: `${env.CDN_BASE_URL}/${path}` };
    },
    { body: anonymousUploadBodySchema }
  );
