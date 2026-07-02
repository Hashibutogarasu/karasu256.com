import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateUserIcon } from "@Hashibutogarasu/db";
import { getAdminAuth } from "@/lib/firebase-admin";
import { requireSession } from "@/lib/api/require-session";

const patchBodySchema = z.object({ iconUrl: z.string().url().nullable() });

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

/**
 * Updates the authenticated user's icon URL.
 *
 * PATCH /api/user
 */
export async function PATCH(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const parsed = patchBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const updated = await updateUserIcon(user.uid, parsed.data.iconUrl);
  return NextResponse.json({ iconUrl: updated.iconUrl });
}
