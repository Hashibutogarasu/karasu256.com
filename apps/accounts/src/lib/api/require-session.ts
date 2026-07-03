import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { unauthorized } from '@/lib/api/responses';

type SessionResult = { user: DecodedIdToken; error: null } | { user: null; error: NextResponse };

/**
 * Reads and verifies the Firebase session cookie.
 * Returns the decoded token on success, or a 401 NextResponse on failure.
 * All Route Handlers that require authentication must call this first.
 */
export async function requireSession(): Promise<SessionResult> {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return { user: null, error: unauthorized() };
  }
  try {
    const user = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return { user, error: null };
  } catch {
    return { user: null, error: unauthorized() };
  }
}
