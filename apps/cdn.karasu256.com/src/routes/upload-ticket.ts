import { Elysia, t } from 'elysia';
import { verifyAccountsJwt } from '../lib/auth';
import { issueUploadTicket } from '../lib/upload-ticket';
import { isValidUploadPath } from '../lib/uploads';

const uploadTicketBodySchema = t.Object({
  path: t.String(),
});

/**
 * Issues a short-lived ticket authorizing a single upload to `path`, for
 * callers that can't rely on `POST /upload`'s cookie-based auth reaching
 * them (see `verifyAccountsJwt`). The caller presents the ticket to
 * `POST /upload` instead of a session cookie.
 */
export const uploadTicketRoute = (env: Env) =>
  new Elysia().post(
    '/upload/ticket',
    async ({ request, body, set }) => {
      const uid = await verifyAccountsJwt(request, env);
      if (!uid) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      if (!isValidUploadPath(body.path, uid)) {
        set.status = 400;
        return { error: 'Invalid upload path' };
      }

      const ticket = await issueUploadTicket(uid, body.path, env);
      return { ticket };
    },
    { body: uploadTicketBodySchema }
  );
