import { NextResponse } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';

import { getSessionUser } from '@/lib/firebase-session';

type SessionResult = { user: DecodedIdToken; error: null } | { user: null; error: NextResponse };

/**
 * Reads and verifies the Firebase session cookie.
 * Returns the decoded token on success, or a 401 NextResponse on failure.
 * All Route Handlers that require authentication must call this first.
 */
export async function requireSession(): Promise<SessionResult> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user, error: null };
}
