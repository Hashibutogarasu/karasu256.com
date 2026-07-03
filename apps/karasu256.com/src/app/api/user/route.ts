import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { users } from "@Hashibutogarasu/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/api/require-session";
import { ensureUser } from "@/lib/db/ensure-user";

const patchBodySchema = z.object({ name: z.string().optional() });

export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  const row = await ensureUser(user.uid, user.name);
  return NextResponse.json({ id: row.id, name: row.name });
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const parsed = patchBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "name must be a string" }, { status: 400 });
  }
  const { name } = parsed.data;

  const db = getDb();
  await ensureUser(user.uid);
  const [updated] = await db
    .update(users)
    .set({ name: name ?? null, updatedAt: new Date() })
    .where(eq(users.id, user.uid))
    .returning();

  return NextResponse.json({ id: updated.id, name: updated.name });
}
