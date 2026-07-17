import { requireUid, verifyAccountsJwt } from './auth';
import { verifyUploadTicket } from './upload-ticket';

export interface UploadAuthResult {
  uid: string | null;
  method: 'ticket' | 'jwt' | 'cookie' | 'none';
}

/**
 * Resolves who is authorized to act on `path`, trying (in order) an upload
 * ticket, a bearer JWT, then a forwarded session cookie. Takes the caller's
 * raw `Authorization`/`Cookie` headers and `path` as plain values rather
 * than an Elysia route context, so it's reusable outside a specific route
 * and independently testable.
 *
 * Logs each step's outcome (`event: 'resolve_upload_auth'`), so a fallback
 * to anonymous (`method: 'none'`) can be traced back to exactly which
 * check was attempted and why it didn't resolve a uid, instead of the
 * cause disappearing into a single boolean result — see also the
 * `verify_accounts_jwt`/`require_uid`/`verify_upload_ticket` events each
 * underlying check logs for its own success/failure detail.
 */
export async function resolveUploadAuth(request: Request, path: string | null, env: Env): Promise<UploadAuthResult> {
  const authHeader = request.headers.get('authorization');
  const hasCookie = request.headers.has('cookie');

  if (path) {
    const ticketUid = await verifyUploadTicket(request, path, env);
    if (ticketUid) {
      console.log(JSON.stringify({ event: 'resolve_upload_auth', method: 'ticket', result: 'success', uid: ticketUid, path }));
      return { uid: ticketUid, method: 'ticket' };
    }
  }

  if (authHeader) {
    const jwtUid = await verifyAccountsJwt(request, env);
    if (jwtUid) {
      console.log(JSON.stringify({ event: 'resolve_upload_auth', method: 'jwt', result: 'success', uid: jwtUid }));
      return { uid: jwtUid, method: 'jwt' };
    }
  }

  if (hasCookie) {
    const cookieUid = await requireUid(request, env);
    if (cookieUid) {
      console.log(JSON.stringify({ event: 'resolve_upload_auth', method: 'cookie', result: 'success', uid: cookieUid }));
      return { uid: cookieUid, method: 'cookie' };
    }
  }

  console.log(
    JSON.stringify({
      event: 'resolve_upload_auth',
      method: 'none',
      result: 'anonymous',
      path,
      hadAuthHeader: Boolean(authHeader),
      hadCookieHeader: hasCookie,
    })
  );
  return { uid: null, method: 'none' };
}
