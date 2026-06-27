import { NextResponse } from "next/server";
import { and, eq, gt, isNull, max, sql } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import { oauthAccessTokens, oauthClients } from "@Hashibutogarasu/db/schema";
import { requireSession } from "@/lib/api/require-session";

/**
 * Returns all OAuth clients that have at least one active (non-revoked,
 * non-expired) access token issued to the authenticated user.
 */
export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  const db = getDb();
  const now = new Date();

  const rows = await db
    .select({
      clientId: oauthClients.id,
      name: oauthClients.name,
      iconUrl: oauthClients.iconUrl,
      permissions: sql<bigint>`max(${oauthAccessTokens.permissions})`,
      lastUsedAt: max(oauthAccessTokens.lastUsedAt),
    })
    .from(oauthAccessTokens)
    .innerJoin(oauthClients, eq(oauthAccessTokens.clientId, oauthClients.id))
    .where(
      and(
        eq(oauthAccessTokens.userId, user.uid),
        isNull(oauthAccessTokens.revokedAt),
        gt(oauthAccessTokens.expiresAt, now),
      ),
    )
    .groupBy(oauthClients.id, oauthClients.name, oauthClients.iconUrl);

  return NextResponse.json(
    rows.map((r) => ({ ...r, permissions: Number(r.permissions) })),
  );
}
