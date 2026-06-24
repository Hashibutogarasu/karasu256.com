import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { oauthClients } from "@Hashibutogarasu/db/schema";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/api/require-session";
import { ensureUser } from "@/lib/db/ensure-user";
import { generateSecret } from "@/lib/crypto";

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

  const body = (await request.json()) as unknown;
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { name, callbackUris, iconUrl, permissions } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (
    !Array.isArray(callbackUris) ||
    callbackUris.length === 0 ||
    !callbackUris.every((u) => typeof u === "string" && u.trim())
  ) {
    return NextResponse.json(
      { error: "callbackUris must be a non-empty array of strings" },
      { status: 400 },
    );
  }
  if (typeof permissions !== "number" || !Number.isInteger(permissions)) {
    return NextResponse.json({ error: "permissions must be an integer" }, { status: 400 });
  }

  await ensureUser(user.uid);
  const { raw: secret, hash: secretHash } = await generateSecret("csc_");

  const db = getDb();
  const [client] = await db
    .insert(oauthClients)
    .values({
      userId: user.uid,
      name: name.trim(),
      callbackUris: (callbackUris as string[]).map((u) => u.trim()),
      iconUrl: typeof iconUrl === "string" ? iconUrl.trim() || null : null,
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
