import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildClearCookieOptions } from '@/lib/session';

/**
 * Clears the Firebase session cookie.
 *
 * Must be cleared with the same `Domain` and `Path` attributes used when
 * setting it.
 *
 * POST /api/auth/logout
 */
export async function POST() {
  const store = await cookies();
  store.set(buildClearCookieOptions());
  return NextResponse.json({ ok: true });
}
