import { NextResponse } from 'next/server';
import { getLinkedProviderIds } from '@Hashibutogarasu/db';
import { requireSession } from '@/lib/api/require-session';

/**
 * Returns the third-party provider IDs linked to the authenticated user.
 *
 * GET /api/users/me/providers
 */
export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  const providerIds = await getLinkedProviderIds(user.uid);
  return NextResponse.json(providerIds);
}
