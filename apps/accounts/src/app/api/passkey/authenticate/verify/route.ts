import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getServerConfig } from "@/lib/config";
import { getDb, passkeyCredentials } from "@Hashibutogarasu/db";

/**
 * Verifies the WebAuthn authentication response, updates the stored credential
 * counter, and returns a Firebase custom token for the authenticated user.
 *
 * The credential is looked up by ID in `passkey_credentials`, which contains
 * the associated uid directly.
 *
 * POST /api/passkey/authenticate/verify
 * Body: `AuthenticationResponseJSON` (returned by `startAuthentication` on the client)
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const challenge = cookieStore.get("passkey_challenge")?.value;

  if (!challenge) {
    return NextResponse.json({ error: "No pending authentication" }, { status: 400 });
  }

  const body: AuthenticationResponseJSON = await request.json();
  const { webauthn } = getServerConfig();
  const db = getDb();

  const [stored] = await db
    .select()
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.id, body.id));

  if (!stored) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }

  const { verified, authenticationInfo } = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challenge,
    expectedOrigin: webauthn.expectedOrigins,
    expectedRPID: webauthn.rpId,
    credential: {
      id: stored.id,
      publicKey: Buffer.from(stored.publicKey, "base64url"),
      counter: stored.counter,
    },
    requireUserVerification: true,
  });

  if (!verified || !authenticationInfo) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  await db
    .update(passkeyCredentials)
    .set({ counter: authenticationInfo.newCounter })
    .where(eq(passkeyCredentials.id, body.id));

  cookieStore.delete("passkey_challenge");

  try {
    await getAdminAuth().getUser(stored.userId);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const customToken = await getAdminAuth().createCustomToken(stored.userId);
  return NextResponse.json({ customToken });
}
