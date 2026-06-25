import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import { providerAccounts } from "@Hashibutogarasu/db/schema";
import { requireSession } from "@/lib/api/require-session";

/**
 * Unlinks a third-party provider from the authenticated user's account.
 * DELETE /api/auth/providers/[provider]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { provider } = await params;
  const db = getDb();
  const result = await db
    .delete(providerAccounts)
    .where(
      and(
        eq(providerAccounts.userId, user.uid),
        eq(providerAccounts.provider, provider),
      ),
    )
    .returning({ id: providerAccounts.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
