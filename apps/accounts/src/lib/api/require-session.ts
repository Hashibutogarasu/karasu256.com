import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session-user';
import { unauthorized } from '@/lib/api/responses';

type SessionResult = { user: DecodedIdToken; error: null } | { user: null; error: NextResponse };

/**
 * Reads and verifies the Firebase session cookie.
 * Returns the decoded token on success, or a 401 NextResponse on failure.
 * All Route Handlers that require authentication must call this first.
 */
export async function requireSession(): Promise<SessionResult> {
  const user = await getSessionUser();
  if (!user) return { user: null, error: unauthorized() };
  return { user, error: null };
}
