import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import { oauthAccessTokens } from "@Hashibutogarasu/db/schema";
import { requireSession } from "@/lib/api/require-session";

/**
 * Revokes all active access tokens issued to the authenticated user for the
 * specified OAuth client.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { clientId } = await params;
  const db = getDb();

  await db
    .update(oauthAccessTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(oauthAccessTokens.clientId, clientId),
        eq(oauthAccessTokens.userId, user.uid),
      ),
    );

  return new NextResponse(null, { status: 204 });
}
