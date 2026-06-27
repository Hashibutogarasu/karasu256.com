import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { sql } from "drizzle-orm";
import { getServerConfig } from "@/lib/config";
import { getDb, users, passkeyCredentials } from "@Hashibutogarasu/db";

/**
 * Verifies the WebAuthn registration response from the browser and persists
 * the new credential to the database.
 *
 * Upserts the user row before inserting the credential to satisfy the FK constraint.
 * Credential data is stored in the `passkey_credentials` table keyed by credential ID.
 *
 * POST /api/passkey/register/verify
 * Body: `{ credential: RegistrationResponseJSON, name: string }`
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
  const db = getDb();

  await db
    .insert(users)
    .values({ id: uid })
    .onConflictDoUpdate({ target: users.id, set: { updatedAt: sql`now()` } });

  await db.insert(passkeyCredentials).values({
    id: credential.id,
    userId: uid,
    name,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports ?? [],
  });

  cookieStore.delete("passkey_challenge");
  cookieStore.delete("passkey_uid");

  return NextResponse.json({ success: true });
}
