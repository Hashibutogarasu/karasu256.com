import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import { users } from "@Hashibutogarasu/db/schema";
import { requireBearer } from "@/lib/api/require-bearer";
import { hasPermission } from "@/lib/permissions/sections";
import { getAdminAuth } from "@/lib/firebase-admin";

/**
 * Reads the authenticated user's profile.
 * Requires a Bearer token with the `profile` read permission.
 */
export async function GET(request: NextRequest) {
  const { userId, permissions, error } = await requireBearer(request);
  if (error) return error;

  if (permissions !== null && !hasPermission(permissions, "profile")) {
    return NextResponse.json({ error: "insufficient_scope" }, { status: 403 });
  }

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let { name } = user;
  if (name === null) {
    const firebaseUser = await getAdminAuth().getUser(user.id);
    name = firebaseUser.displayName ?? null;
    if (name !== null) {
      await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));
    }
  }

  return NextResponse.json({ id: user.id, name });
}

/**
 * Updates the authenticated user's display name.
 * Requires a Bearer token with the `profile` write permission.
 */
export async function PATCH(request: NextRequest) {
  const { userId, permissions, error } = await requireBearer(request);
  if (error) return error;

  if (permissions !== null && !hasPermission(permissions, "profile", "write")) {
    return NextResponse.json({ error: "insufficient_scope" }, { status: 403 });
  }

  const body = (await request.json()) as unknown;
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { name } = body as Record<string, unknown>;
  if (typeof name !== "string" && name !== null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ name: name ?? null, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id, name: users.name });

  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ id: updated.id, name: updated.name });
}
