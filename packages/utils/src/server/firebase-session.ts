import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from './firebase-admin';
import { SESSION_COOKIE_NAME } from './session-cookie';

/**
 * Reads and verifies the Firebase session cookie shared across (sub)domains.
 * Returns the decoded token when valid, or `null` when absent or invalid.
 *
 * Must only be called from Server Components or Route Handlers.
 */
export async function getSessionUser(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
