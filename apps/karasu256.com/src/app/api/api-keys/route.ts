import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { apiKeys } from "@Hashibutogarasu/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/api/require-session";
import { ensureUser } from "@/lib/db/ensure-user";
import { generateSecret } from "@/lib/crypto";

const postBodySchema = z.object({ name: z.string().trim().min(1) });

export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  const db = getDb();
  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.uid));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const parsed = postBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const { name } = parsed.data;

  await ensureUser(user.uid);
  const { raw: key, hash: keyHash } = await generateSecret("ksk_");
  const keyPrefix = key.slice(0, 12);

  const db = getDb();
  const [row] = await db
    .insert(apiKeys)
    .values({ userId: user.uid, name, keyHash, keyPrefix })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
    });

  return NextResponse.json({ ...row, key }, { status: 201 });
}
