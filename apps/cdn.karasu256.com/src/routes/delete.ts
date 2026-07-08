import { Elysia } from 'elysia';
import { requireUid } from '../lib/auth';
import { deleteImage } from '../lib/images';

/**
 * Deletes a previously uploaded image from R2 by its object key. Used to
 * clean up a user's or OAuth client's old icon once a new one has replaced
 * it.
 */
export const deleteRoute = (env: Env) =>
  new Elysia().delete('/*', async ({ request, path, set }) => {
    const key = path.slice(1);
    if (!key) {
      set.status = 404;
      return { error: 'Not Found' };
    }

    const uid = await requireUid(request, env);
    if (!uid) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    await deleteImage(key, env);
    set.status = 204;
  });
