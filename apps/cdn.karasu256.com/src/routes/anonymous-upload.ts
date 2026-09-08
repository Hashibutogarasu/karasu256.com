import { Elysia, t } from 'elysia';
import { checkAndIncrementRateLimit } from '../lib/rate-limit';
import { ALLOWED_TYPES, MAX_FILE_BYTES, isValidAnonymousUploadPath } from '../lib/uploads';
import { putImage } from '../lib/images';
import { consumeChallengeToken } from '../lib/challenge';

const anonymousUploadBodySchema = t.Object({
  file: t.Optional(t.File()),
  path: t.Optional(t.String()),
});

/**
 * Handles unauthenticated uploads restricted to the `qr/anonymous/{datetime}.png`
 * path scheme, rate-limited per IP since there is no uid to scope abuse to.
 * Also requires a valid challenge token (see `challenge-token.ts`) embedded
 * in the uploaded bytes, so a caller must round-trip through this Worker
 * first rather than POSTing an arbitrary file directly.
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

      const rawBuffer = new Uint8Array(await body.file.arrayBuffer());
      const payload = await consumeChallengeToken(rawBuffer, env);
      if (!payload) {
        set.status = 403;
        return { error: 'Invalid or missing challenge token' };
      }

      if (payload.byteLength > MAX_FILE_BYTES) {
        set.status = 413;
        return { error: 'File exceeds 5 MB limit' };
      }

      await putImage(path, payload.buffer as ArrayBuffer, body.file.type, env);

      return { url: `${env.CDN_BASE_URL}/${path}` };
    },
    { body: anonymousUploadBodySchema }
  );
