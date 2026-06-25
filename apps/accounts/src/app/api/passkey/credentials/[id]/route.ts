import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDatabase } from "@/lib/firebase-admin";

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
 * Deletes a single passkey credential owned by the authenticated user.
 *
 * Removes both the credential record at `/passkeys/{uid}/credentials/{id}`
 * and the reverse-lookup entry at `/passkey-index/{id}`.
 *
 * DELETE /api/passkey/credentials/{id}
 * Authorization: Bearer {Firebase ID token}
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const uid = await resolveUid(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getAdminDatabase();

  const snap = await db.ref(`passkeys/${uid}/credentials/${id}`).get();
  if (!snap.exists()) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }

  await Promise.all([
    db.ref(`passkeys/${uid}/credentials/${id}`).remove(),
    db.ref(`passkey-index/${id}`).remove(),
  ]);

  return NextResponse.json({ success: true });
}
