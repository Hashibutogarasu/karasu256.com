import 'server-only';

import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from '@Hashibutogarasu/db';
import { qrGenerations } from '@Hashibutogarasu/db/schema';

export interface HistoryItem {
  id: string;
  url: string;
  createdAt: Date;
}

export interface ListQrGenerationsResult {
  items: HistoryItem[];
  totalPages: number;
}

/** Lists `uid`'s own QR generation history, newest first, paginated to `pageSize` rows per page. */
export async function listQrGenerations(uid: string, page: number, pageSize = 10): Promise<ListQrGenerationsResult> {
  const db = getDb();
  const offset = (page - 1) * pageSize;

  const [items, totalRows] = await Promise.all([
    db
      .select({ id: qrGenerations.id, url: qrGenerations.url, createdAt: qrGenerations.createdAt })
      .from(qrGenerations)
      .where(eq(qrGenerations.userId, uid))
      .orderBy(desc(qrGenerations.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(qrGenerations)
      .where(eq(qrGenerations.userId, uid)),
  ]);

  const total = totalRows[0]?.count ?? 0;
  return { items, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/**
 * Deletes the given QR generation rows, scoped to `uid` so a caller can only
 * ever delete their own history — ids owned by another user (or that don't
 * exist) are silently ignored. Returns the deleted rows' URLs, for the
 * caller to also remove from the CDN.
 */
export async function deleteQrGenerations(uid: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];

  const db = getDb();
  const rows = await db
    .select({ id: qrGenerations.id, url: qrGenerations.url })
    .from(qrGenerations)
    .where(and(eq(qrGenerations.userId, uid), inArray(qrGenerations.id, ids)));
  if (rows.length === 0) return [];

  await db.delete(qrGenerations).where(
    inArray(
      qrGenerations.id,
      rows.map((row) => row.id)
    )
  );
  return rows.map((row) => row.url);
}
