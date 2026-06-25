import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { getAdminAuth, getAdminDatabase } from "@/lib/firebase-admin";
import { getServerConfig } from "@/lib/config";

/**
 * Verifies the WebAuthn authentication response, updates the stored credential
 * counter, and returns a Firebase custom token for the authenticated user.
 *
 * The credential is looked up via `/passkey-index/{credentialID}` to resolve the uid,
 * then the stored public key and counter are fetched from
 * `/passkeys/{uid}/credentials/{credentialID}`.
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
  const db = getAdminDatabase();

  const indexSnap = await db.ref(`passkey-index/${body.id}`).get();
  if (!indexSnap.exists()) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }
  const { uid } = indexSnap.val() as { uid: string };

  const credSnap = await db.ref(`passkeys/${uid}/credentials/${body.id}`).get();
  if (!credSnap.exists()) {
    return NextResponse.json({ error: "Credential data not found" }, { status: 404 });
  }
  const stored = credSnap.val() as {
    id: string;
    publicKey: string;
    counter: number;
    transports?: string[];
  };

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
    .ref(`passkeys/${uid}/credentials/${body.id}/counter`)
    .set(authenticationInfo.newCounter);
  cookieStore.delete("passkey_challenge");

  const customToken = await getAdminAuth().createCustomToken(uid);
  return NextResponse.json({ customToken });
}
