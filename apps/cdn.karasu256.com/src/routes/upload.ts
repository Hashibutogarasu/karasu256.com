import { Elysia, t } from 'elysia';
import { requireUid, verifyAccountsJwt } from '../lib/auth';
import { ALLOWED_TYPES, MAX_FILE_BYTES, TYPE_TO_EXT, isValidUploadPath } from '../lib/uploads';
import { putImage } from '../lib/images';
import { consumeChallengeToken } from '../lib/challenge';
import { verifyUploadTicket } from '../lib/upload-ticket';

const uploadBodySchema = t.Object({
  file: t.Optional(t.File()),
  path: t.Optional(t.String()),
});

export const uploadRoute = (env: Env) =>
  new Elysia().post(
    '/upload',
    async ({ request, body, set }) => {
      const explicitPath = body.path ?? null;

      const ticketUid = explicitPath ? await verifyUploadTicket(request, explicitPath, env) : null;
      const uid = ticketUid ?? (await verifyAccountsJwt(request, env)) ?? (await requireUid(request, env));
      if (!uid) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      if (!body.file) {
        set.status = 400;
        return { error: 'Missing file field' };
      }

      if (explicitPath && !ticketUid && !isValidUploadPath(explicitPath, uid)) {
        set.status = 400;
        return { error: 'Invalid upload path' };
      }

      if (!ALLOWED_TYPES.has(body.file.type)) {
        set.status = 400;
        return { error: 'Unsupported image type. Allowed: jpeg, png, webp.' };
      }

      // QR uploads additionally require a valid challenge token embedded in
      // the file (see `challenge-token.ts`); other purposes on this shared
      // route (avatars, OAuth client icons) are unaffected.
      const isQrUpload = explicitPath !== null && explicitPath.startsWith('qr/');
      let payloadBuffer: ArrayBuffer;
      if (isQrUpload) {
        const rawBuffer = new Uint8Array(await body.file.arrayBuffer());
        const payload = await consumeChallengeToken(rawBuffer, env);
        if (!payload) {
          set.status = 403;
          return { error: 'Invalid or missing challenge token' };
        }
        payloadBuffer = payload.buffer;
      } else {
        payloadBuffer = await body.file.arrayBuffer();
      }

      if (payloadBuffer.byteLength > MAX_FILE_BYTES) {
        set.status = 413;
        return { error: 'File exceeds 5 MB limit' };
      }

      const ext = TYPE_TO_EXT[body.file.type];
      const key = explicitPath ?? `users/${uid}/images/${crypto.randomUUID()}.${ext}`;
      await putImage(key, payloadBuffer, body.file.type, env);

      return { url: `${env.CDN_BASE_URL}/${key}` };
    },
    { body: uploadBodySchema }
  );
