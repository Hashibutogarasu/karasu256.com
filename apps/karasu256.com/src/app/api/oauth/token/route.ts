import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@Hashibutogarasu/db";
import {
  oauthAccessTokens,
  oauthAuthorizationCodes,
  oauthClients,
} from "@Hashibutogarasu/db/schema";
import { generateSecret, hashSecret } from "@/lib/crypto";

/**
 * OAuth 2.0 token endpoint. Supports the authorization_code grant type only.
 *
 * Accepts application/x-www-form-urlencoded with the following fields:
 *   grant_type, code, client_id, client_secret, redirect_uri
 *
 * Returns `{ access_token, token_type, expires_in }` on success.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
  }

  const text = await request.text();
  const params = new URLSearchParams(text);

  const grantType = params.get("grant_type");
  const code = params.get("code");
  const clientId = params.get("client_id");
  const clientSecret = params.get("client_secret");
  const redirectUri = params.get("redirect_uri");

  if (grantType !== "authorization_code") {
    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
  }
  if (!code || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const db = getDb();

  const secretHash = await hashSecret(clientSecret);
  const [client] = await db
    .select({ id: oauthClients.id })
    .from(oauthClients)
    .where(and(eq(oauthClients.id, clientId), eq(oauthClients.secretHash, secretHash)));

  if (!client) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 });
  }

  const codeHash = await hashSecret(code);
  const now = new Date();

  const [authCode] = await db
    .select({
      id: oauthAuthorizationCodes.id,
      userId: oauthAuthorizationCodes.userId,
      redirectUri: oauthAuthorizationCodes.redirectUri,
      permissions: oauthAuthorizationCodes.permissions,
      expiresAt: oauthAuthorizationCodes.expiresAt,
      usedAt: oauthAuthorizationCodes.usedAt,
    })
    .from(oauthAuthorizationCodes)
    .where(
      and(
        eq(oauthAuthorizationCodes.codeHash, codeHash),
        eq(oauthAuthorizationCodes.clientId, client.id),
      ),
    );

  if (
    !authCode ||
    authCode.usedAt !== null ||
    authCode.expiresAt <= now ||
    authCode.redirectUri !== redirectUri
  ) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  await db
    .update(oauthAuthorizationCodes)
    .set({ usedAt: now })
    .where(eq(oauthAuthorizationCodes.id, authCode.id));

  const { raw: accessToken, hash: tokenHash } = await generateSecret("tok_");
  const tokenPrefix = accessToken.slice(0, 12);
  const expiresIn = 365 * 24 * 60 * 60;
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  await db.insert(oauthAccessTokens).values({
    tokenHash,
    tokenPrefix,
    clientId: client.id,
    userId: authCode.userId,
    permissions: authCode.permissions,
    expiresAt,
  });

  return NextResponse.json({
    access_token: accessToken,
    token_type: "bearer",
    expires_in: expiresIn,
  });
}
