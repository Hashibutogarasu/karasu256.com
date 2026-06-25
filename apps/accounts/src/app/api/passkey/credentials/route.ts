import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDatabase } from "@/lib/firebase-admin";

/** Shape of a stored passkey credential returned to the client (no public key). */
export interface CredentialSummary {
  id: string;
  name: string;
  counter: number;
  transports: string[];
  createdAt: number | null;
}

async function resolveUid(request: NextRequest): Promise<string | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
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
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snap = await getAdminDatabase().ref(`passkeys/${uid}/credentials`).get();
  if (!snap.exists()) return NextResponse.json({ credentials: [] });

  const raw = snap.val() as Record<
    string,
    { id: string; name: string; counter: number; transports: string[]; createdAt?: number }
  >;

  const credentials: CredentialSummary[] = Object.values(raw).map((c) => ({
    id: c.id,
    name: c.name,
    counter: c.counter,
    transports: c.transports,
    createdAt: c.createdAt ?? null,
  }));

  return NextResponse.json({ credentials });
}
