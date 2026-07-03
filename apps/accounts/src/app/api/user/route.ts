import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { requireSession } from '@/lib/api/require-session';

/**
 * Deletes the authenticated user's Firebase account via the Admin SDK.
 *
 * Used for non-password users (OAuth and passkey sign-ins) whose Firebase
 * accounts are linked through custom tokens rather than a re-authenticatable
 * OAuth provider, making client-side `reauthenticateWithPopup` unavailable.
 *
 * DELETE /api/user
 */
export async function DELETE() {
  const { user, error } = await requireSession();
  if (error) return error;

  await getAdminAuth().deleteUser(user.uid);
  return new NextResponse(null, { status: 204 });
}
