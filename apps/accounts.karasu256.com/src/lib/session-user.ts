import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@Hashibutogarasu/utils/constants';

/**
 * Reads and verifies the Firebase session cookie.
 * Returns the decoded token when valid, or `null` when absent or invalid.
 *
 * Must only be called from Server Components or Route Handlers.
 */
export async function getSessionUser(): Promise<DecodedIdToken | null> {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
