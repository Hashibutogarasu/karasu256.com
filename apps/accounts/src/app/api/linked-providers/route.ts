import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import { providerAccounts } from "@Hashibutogarasu/db/schema";
import { requireSession } from "@/lib/api/require-session";

/**
 * Returns the list of third-party providers linked to the authenticated user.
 * GET /api/linked-providers
 */
export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  const db = getDb();
  const rows = await db
    .select({
      provider: providerAccounts.provider,
      name: providerAccounts.name,
      email: providerAccounts.email,
      avatarUrl: providerAccounts.avatarUrl,
    })
    .from(providerAccounts)
    .where(eq(providerAccounts.userId, user.uid));

  return NextResponse.json(rows);
}
