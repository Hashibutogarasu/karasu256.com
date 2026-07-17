import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';

const ticketPayloadSchema = z.object({ uid: z.string(), path: z.string() });

function ticketSecret(env: Env): Uint8Array {
  return new TextEncoder().encode(env.UPLOAD_TICKET_SECRET);
}

/**
 * Issues a short-lived ticket authorizing a single upload to `path` on
 * behalf of `uid`. Lets the actual upload request (see `verifyUploadTicket`)
 * skip re-proving the caller's session — that's already been done once, by
 * whoever requested this ticket via `verifyAccountsJwt`.
 */
export async function issueUploadTicket(uid: string, path: string, env: Env, ttlSeconds = 60): Promise<string> {
  return new SignJWT({ uid, path }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${ttlSeconds}s`).sign(ticketSecret(env));
}

/**
 * Verifies a ticket from {@link issueUploadTicket}, returning the uid it
 * was issued for, or null when the header is missing, the ticket is
 * expired or tampered with, or it was issued for a different path than
 * `expectedPath`.
 */
export async function verifyUploadTicket(request: Request, expectedPath: string, env: Env): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const { payload } = await jwtVerify(authHeader.slice(7), ticketSecret(env));
    const ticket = ticketPayloadSchema.parse(payload);
    if (ticket.path !== expectedPath) {
      console.error(JSON.stringify({ event: 'verify_upload_ticket', result: 'path_mismatch', expectedPath, ticketPath: ticket.path }));
      return null;
    }
    console.log(JSON.stringify({ event: 'verify_upload_ticket', result: 'success', uid: ticket.uid, path: ticket.path }));
    return ticket.uid;
  } catch (err) {
    console.error(JSON.stringify({ event: 'verify_upload_ticket', result: 'failure', error: err instanceof Error ? err.message : String(err) }));
    return null;
  }
}
