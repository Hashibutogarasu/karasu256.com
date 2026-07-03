import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getDb, passkeyCredentials } from '@Hashibutogarasu/db';

/** Shape of a stored passkey credential returned to the client (no public key). */
export interface CredentialSummary {
  id: string;
  name: string;
  counter: number;
  transports: string[];
  createdAt: number | null;
}

async function resolveUid(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(auth.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * Returns all passkey credentials registered for the authenticated user.
 *
 * GET /api/passkey/credentials
 * Authorization: Bearer {Firebase ID token}
 */
export async function GET(request: NextRequest) {
  const uid = await resolveUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({
      id: passkeyCredentials.id,
      name: passkeyCredentials.name,
      counter: passkeyCredentials.counter,
      transports: passkeyCredentials.transports,
      createdAt: passkeyCredentials.createdAt,
    })
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.userId, uid));

  const credentials: CredentialSummary[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    counter: r.counter,
    transports: r.transports,
    createdAt: r.createdAt ? r.createdAt.getTime() : null,
  }));

  return NextResponse.json({ credentials });
}
