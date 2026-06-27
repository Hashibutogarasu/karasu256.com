import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getDb, passkeyCredentials } from "@Hashibutogarasu/db";

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
 * Ownership is enforced by requiring both the credential ID and the caller's uid
 * to match, so a user cannot delete another user's credential.
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
  const db = getDb();

  const [existing] = await db
    .select({ id: passkeyCredentials.id })
    .from(passkeyCredentials)
    .where(and(eq(passkeyCredentials.id, id), eq(passkeyCredentials.userId, uid)));

  if (!existing) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }

  await db
    .delete(passkeyCredentials)
    .where(and(eq(passkeyCredentials.id, id), eq(passkeyCredentials.userId, uid)));

  return NextResponse.json({ success: true });
}
