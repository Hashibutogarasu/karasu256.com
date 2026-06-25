import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { z } from "zod";
import { getAdminAuth, getAdminDatabase } from "@/lib/firebase-admin";
import { getServerConfig } from "@/lib/config";

const bodySchema = z.object({ email: z.string().email() });

/**
 * Generates a WebAuthn registration challenge for the given email address.
 *
 * - Gets or creates a Firebase user for the email via Admin SDK.
 * - Excludes credentials the user has already registered.
 * - Stores the challenge and uid in HTTP-only cookies for the verify step.
 *
 * POST /api/passkey/register/challenge
 * Body: `{ email: string }`
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email } = parsed.data;
  const { webauthn } = getServerConfig();

  let uid: string;
  try {
    const user = await getAdminAuth().getUserByEmail(email);
    uid = user.uid;
  } catch {
    const user = await getAdminAuth().createUser({ email });
    uid = user.uid;
  }

  const db = getAdminDatabase();
  const snapshot = await db.ref(`passkeys/${uid}/credentials`).get();
  const existingCredentials: { id: string }[] = snapshot.exists()
    ? Object.values(snapshot.val() as Record<string, { id: string }>).map((c) => ({ id: c.id }))
    : [];

  const options = await generateRegistrationOptions({
    rpName: webauthn.rpName,
    rpID: webauthn.rpId,
    userID: Buffer.from(uid),
    userName: email,
    excludeCredentials: existingCredentials,
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
  });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300,
    sameSite: "strict" as const,
    path: "/",
  };
  const cookieStore = await cookies();
  cookieStore.set("passkey_challenge", options.challenge, cookieOpts);
  cookieStore.set("passkey_uid", uid, cookieOpts);

  return NextResponse.json({ options });
}
