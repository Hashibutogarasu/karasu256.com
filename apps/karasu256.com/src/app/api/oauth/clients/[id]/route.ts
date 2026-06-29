import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { oauthClients } from "@Hashibutogarasu/db/schema";
import { and, eq } from "drizzle-orm";

import { requireSession } from "@/lib/api/require-session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const body = (await request.json()) as unknown;
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { name, callbackUris, iconUrl, permissions } = body as Record<string, unknown>;

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
  }
  if (callbackUris !== undefined) {
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
  }
  if (permissions !== undefined && (typeof permissions !== "number" || !Number.isInteger(permissions))) {
    return NextResponse.json({ error: "permissions must be an integer" }, { status: 400 });
  }

  const db = getDb();
  const patch: Partial<{
    name: string;
    callbackUris: string[];
    iconUrl: string | null;
    permissions: bigint;
  }> = {};

  if (name !== undefined) patch.name = (name as string).trim();
  if (callbackUris !== undefined) patch.callbackUris = (callbackUris as string[]).map((u) => u.trim());
  if (iconUrl !== undefined) patch.iconUrl = typeof iconUrl === "string" ? iconUrl.trim() || null : null;
  if (permissions !== undefined) patch.permissions = BigInt(permissions as number);

  const [updated] = await db
    .update(oauthClients)
    .set(patch)
    .where(and(eq(oauthClients.id, id), eq(oauthClients.userId, user.uid)))
    .returning({
      id: oauthClients.id,
      name: oauthClients.name,
      iconUrl: oauthClients.iconUrl,
      callbackUris: oauthClients.callbackUris,
      permissions: oauthClients.permissions,
      createdAt: oauthClients.createdAt,
    });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ...updated, permissions: Number(updated.permissions) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const db = getDb();
  const result = await db
    .delete(oauthClients)
    .where(and(eq(oauthClients.id, id), eq(oauthClients.userId, user.uid)))
    .returning({ id: oauthClients.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
