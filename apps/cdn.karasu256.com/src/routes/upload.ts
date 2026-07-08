import { Elysia, t } from 'elysia';
import { requireUid } from '../lib/auth';
import { ALLOWED_TYPES, MAX_FILE_BYTES, TYPE_TO_EXT, isValidUploadPath } from '../lib/uploads';
import { putImage } from '../lib/images';

const uploadBodySchema = t.Object({
  file: t.Optional(t.File()),
  path: t.Optional(t.String()),
});

export const uploadRoute = (env: Env) =>
  new Elysia().post(
    '/upload',
    async ({ request, body, set }) => {
      const uid = await requireUid(request, env);
      if (!uid) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      if (!body.file) {
        set.status = 400;
        return { error: 'Missing file field' };
      }

      const explicitPath = body.path ?? null;
      if (explicitPath && !isValidUploadPath(explicitPath, uid)) {
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

      const ext = TYPE_TO_EXT[body.file.type];
      const key = explicitPath ?? `users/${uid}/images/${crypto.randomUUID()}.${ext}`;
      await putImage(key, buffer, body.file.type, env);

      return { url: `${env.CDN_BASE_URL}/${key}` };
    },
    { body: uploadBodySchema }
  );
