import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { getAdminDatabase } from "@/lib/firebase-admin";
import { getServerConfig } from "@/lib/config";

/**
 * Verifies the WebAuthn registration response from the browser and persists
 * the new credential to Firebase Realtime Database.
 *
 * Credential data is stored at `/passkeys/{uid}/credentials/{credentialID}`.
 * A reverse-lookup index is stored at `/passkey-index/{credentialID}`.
 *
 * POST /api/passkey/register/verify
 * Body: `RegistrationResponseJSON` (returned by `startRegistration` on the client)
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const challenge = cookieStore.get("passkey_challenge")?.value;
  const uid = cookieStore.get("passkey_uid")?.value;

  if (!challenge || !uid) {
    return NextResponse.json({ error: "No pending registration" }, { status: 400 });
  }

  const { credential: body, name } = (await request.json()) as {
    credential: RegistrationResponseJSON;
    name: string;
  };
  const { webauthn } = getServerConfig();

  const { verified, registrationInfo } = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge,
    expectedOrigin: webauthn.expectedOrigins,
    expectedRPID: webauthn.rpId,
    requireUserVerification: true,
  });

  if (!verified || !registrationInfo) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential } = registrationInfo;
  const credentialRecord = {
    id: credential.id,
    name,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports ?? [],
    createdAt: Date.now(),
  };

  const db = getAdminDatabase();
  await db.ref(`passkeys/${uid}/credentials/${credential.id}`).set(credentialRecord);
  await db.ref(`passkey-index/${credential.id}`).set({ uid });

  cookieStore.delete("passkey_challenge");
  cookieStore.delete("passkey_uid");

  return NextResponse.json({ success: true });
}
