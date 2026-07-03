import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@Hashibutogarasu/db';
import { oauthClients } from '@Hashibutogarasu/db/schema';
import { requireSession } from '@/lib/api/require-session';
import { generateSecret } from '@/lib/crypto';

/**
 * Rotates the client secret for the given OAuth client.
 * The new raw secret is returned once; only its hash is stored.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const { raw: secret, hash: secretHash } = await generateSecret('csc_');

  const db = getDb();
  const [updated] = await db
    .update(oauthClients)
    .set({ secretHash })
    .where(and(eq(oauthClients.id, id), eq(oauthClients.userId, user.uid)))
    .returning({ id: oauthClients.id });

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ secret });
}
