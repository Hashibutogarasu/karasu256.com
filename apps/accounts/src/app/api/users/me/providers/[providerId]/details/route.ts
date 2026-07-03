import { NextRequest, NextResponse } from 'next/server';
import { getProviderAccount } from '@Hashibutogarasu/db';
import { requireSession } from '@/lib/api/require-session';

/**
 * Returns the authenticated user's profile for a single linked provider.
 *
 * GET /api/users/me/providers/[providerId]/details
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ providerId: string }> }) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { providerId } = await params;
  const account = await getProviderAccount(user.uid, providerId);
  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ name: account.name, email: account.email, avatarUrl: account.avatarUrl });
}
