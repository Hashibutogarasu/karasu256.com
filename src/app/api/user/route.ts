import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { users } from "@Hashibutogarasu/db/schema";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/api/require-session";
import { ensureUser } from "@/lib/db/ensure-user";

export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  const row = await ensureUser(user.uid, user.name);
  return NextResponse.json({ id: row.id, name: row.name });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const body = (await request.json()) as unknown;
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { name } = body as Record<string, unknown>;
  if (name !== undefined && typeof name !== "string") {
    return NextResponse.json({ error: "name must be a string" }, { status: 400 });
  }

  const db = getDb();
  await ensureUser(user.uid);
  const [updated] = await db
    .update(users)
    .set({ name: name ?? null, updatedAt: new Date() })
    .where(eq(users.id, user.uid))
    .returning();

  return NextResponse.json({ id: updated.id, name: updated.name });
}
