import { NextResponse } from 'next/server';
import { getProviderAccounts } from '@Hashibutogarasu/db';
import { requireSession } from '@/lib/api/require-session';

/**
 * Returns the third-party providers linked to the authenticated user, keyed
 * by provider ID.
 *
 * GET /api/users/me/providers
 */
export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  const rows = await getProviderAccounts(user.uid);
  const body: Record<string, { name: string | null; email: string | null; avatarUrl: string | null }> = {};
  for (const row of rows) {
    body[row.provider] = { name: row.name, email: row.email, avatarUrl: row.avatarUrl };
  }

  return NextResponse.json(body);
}
