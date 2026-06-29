import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import { oauthAuthorizationCodes, oauthClients } from "@Hashibutogarasu/db/schema";
import { requireSession } from "@/lib/api/require-session";
import { generateSecret } from "@/lib/crypto";

/**
 * Issues an OAuth authorization code after the user consents, or returns an
 * access_denied error URL when the user declines.
 *
 * Returns `{ redirectUrl }` — the client navigates to that URL.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireSession();
  if (error) return error;

  const body = (await request.json()) as unknown;
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { clientId, redirectUri, permissions, state, approved } = body as Record<string, unknown>;

  if (typeof clientId !== "string" || !clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  if (typeof redirectUri !== "string" || !redirectUri) {
    return NextResponse.json({ error: "redirectUri is required" }, { status: 400 });
  }
  if (typeof permissions !== "number" || !Number.isInteger(permissions)) {
    return NextResponse.json({ error: "permissions must be an integer" }, { status: 400 });
  }

  const callback = new URL(redirectUri);
  if (state !== undefined && state !== null) {
    callback.searchParams.set("state", String(state));
  }

  if (approved !== true) {
    callback.searchParams.set("error", "access_denied");
    return NextResponse.json({ redirectUrl: callback.toString() });
  }

  const db = getDb();
  const [client] = await db
    .select({
      id: oauthClients.id,
      callbackUris: oauthClients.callbackUris,
      permissions: oauthClients.permissions,
    })
    .from(oauthClients)
    .where(eq(oauthClients.id, clientId));

  if (!client || !client.callbackUris.includes(redirectUri)) {
    return NextResponse.json({ error: "Invalid client or redirect_uri" }, { status: 400 });
  }

  const requestedPermissions = BigInt(permissions);
  if ((requestedPermissions & ~client.permissions) !== 0n) {
    return NextResponse.json(
      { error: "Requested permissions exceed client registration" },
      { status: 400 },
    );
  }

  const { raw: code, hash: codeHash } = await generateSecret("code_");

  await db.insert(oauthAuthorizationCodes).values({
    codeHash,
    clientId: client.id,
    userId: user.uid,
    redirectUri,
    permissions: requestedPermissions,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  callback.searchParams.set("code", code);
  return NextResponse.json({ redirectUrl: callback.toString() });
}
