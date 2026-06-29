import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { apiKeys } from "@Hashibutogarasu/db/schema";
import { and, eq } from "drizzle-orm";

import { requireSession } from "@/lib/api/require-session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = getDb();
  const result = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, user.uid)))
    .returning({ id: apiKeys.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
