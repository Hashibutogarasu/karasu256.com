import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { oauthClients } from "@Hashibutogarasu/db/schema";
import { and, eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME, deleteUploadedImage } from "@Hashibutogarasu/utils/server";

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

  const [previous] = await db
    .select({ iconUrl: oauthClients.iconUrl })
    .from(oauthClients)
    .where(and(eq(oauthClients.id, id), eq(oauthClients.userId, user.uid)));

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

  const imageApiUrl = process.env.NEXT_PUBLIC_IMAGE_API_URL;
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (imageApiUrl && sessionCookie && previous?.iconUrl && previous.iconUrl !== updated.iconUrl) {
    await deleteUploadedImage(previous.iconUrl, { imageApiUrl, sessionCookie });
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
