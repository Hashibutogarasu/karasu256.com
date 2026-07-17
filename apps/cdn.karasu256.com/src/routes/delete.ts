import { Elysia } from 'elysia';
import { verifyCronJobsKey } from '../lib/auth';
import { resolveUploadAuth } from '../lib/upload-auth';
import { deleteImage } from '../lib/images';

/**
 * Deletes a previously uploaded image from R2 by its object key. Used to
 * clean up a user's or OAuth client's old icon once a new one has replaced
 * it, or by `cron-jobs`'s scheduled cleanup of anonymous QR uploads.
 */
export const deleteRoute = (env: Env) =>
  new Elysia().delete('/*', async ({ request, path, set }) => {
    const key = path.slice(1);
    if (!key) {
      set.status = 404;
      return { error: 'Not Found' };
    }

    const isTrustedService = verifyCronJobsKey(request, env);
    const { uid } = isTrustedService ? { uid: null } : await resolveUploadAuth(request, null, env);
    if (!isTrustedService && !uid) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    await deleteImage(key, env);
    set.status = 204;
  });
