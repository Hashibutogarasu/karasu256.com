import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@Hashibutogarasu/db";
import { oauthClients } from "@Hashibutogarasu/db/schema";
import { and, eq } from "drizzle-orm";
import { SESSION_COOKIE_NAME, deleteUploadedImage } from "@Hashibutogarasu/utils/server";
import { z } from "zod";

import { requireSession } from "@/lib/api/require-session";

const patchBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  callbackUris: z.array(z.string().trim().min(1)).min(1).optional(),
  iconUrl: z.string().nullable().optional(),
  permissions: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { id } = await params;
  const parsed = patchBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { name, callbackUris, iconUrl, permissions } = parsed.data;

  const db = getDb();
  const patch: Partial<{
    name: string;
    callbackUris: string[];
    iconUrl: string | null;
    permissions: bigint;
  }> = {};

  if (name !== undefined) patch.name = name;
  if (callbackUris !== undefined) patch.callbackUris = callbackUris;
  if (iconUrl !== undefined) patch.iconUrl = iconUrl?.trim() || null;
  if (permissions !== undefined) patch.permissions = BigInt(permissions);

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
