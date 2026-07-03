import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { oauthClients } from "@Hashibutogarasu/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireSession } from "@/lib/api/require-session";
import { ensureUser } from "@/lib/db/ensure-user";
import { generateSecret } from "@/lib/crypto";

const postBodySchema = z.object({
  name: z.string().trim().min(1),
  callbackUris: z.array(z.string().trim().min(1)).min(1),
  iconUrl: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  permissions: z.number().int(),
});

export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  const db = getDb();
  const rows = await db
    .select({
      id: oauthClients.id,
      name: oauthClients.name,
      iconUrl: oauthClients.iconUrl,
      callbackUris: oauthClients.callbackUris,
      permissions: oauthClients.permissions,
      createdAt: oauthClients.createdAt,
    })
    .from(oauthClients)
    .where(eq(oauthClients.userId, user.uid));

  return NextResponse.json(rows.map((r) => ({ ...r, permissions: Number(r.permissions) })));
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const parsed = postBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { name, callbackUris, iconUrl, permissions } = parsed.data;

  await ensureUser(user.uid);
  const { raw: secret, hash: secretHash } = await generateSecret("csc_");

  const db = getDb();
  const [client] = await db
    .insert(oauthClients)
    .values({
      userId: user.uid,
      name,
      callbackUris,
      iconUrl,
      secretHash,
      permissions: BigInt(permissions),
    })
    .returning({
      id: oauthClients.id,
      name: oauthClients.name,
      iconUrl: oauthClients.iconUrl,
      callbackUris: oauthClients.callbackUris,
      permissions: oauthClients.permissions,
      createdAt: oauthClients.createdAt,
    });

  return NextResponse.json(
    { ...client, permissions: Number(client.permissions), secret },
    { status: 201 },
  );
}
