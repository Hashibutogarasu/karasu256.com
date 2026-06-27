import { randomBytes, createHash } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getServerConfig } from "@/lib/config";
import { sendPasswordResetEmail } from "@Hashibutogarasu/utils/email";
import { getDb, passwordResetTokens } from "@Hashibutogarasu/db";

/** One-time code expiry: 15 minutes. */
const CODE_EXPIRY_MS = 15 * 60 * 1000;

function getBaseUrl(request: NextRequest): string {
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3001";
  return `${proto}://${host}`;
}

/**
 * Generates a one-time password-reset token, stores its SHA-256 hash in
 * PostgreSQL, and sends a reset email via Resend.
 *
 * Returns HTTP 200 regardless of whether the email address is registered,
 * to prevent email-enumeration attacks.
 */
export async function POST(request: NextRequest) {
  let email: string;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  let uid: string;
  try {
    const user = await getAdminAuth().getUserByEmail(email);
    uid = user.uid;
  } catch {
    return NextResponse.json({ success: true });
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await getDb().insert(passwordResetTokens).values({
    userId: uid,
    tokenHash,
    expiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
  });

  const resetUrl = `${getBaseUrl(request)}/reset-password/confirm?uid=${uid}&token=${rawToken}`;
  const { resend } = getServerConfig();
  await sendPasswordResetEmail({
    apiKey: resend.apiKey,
    from: resend.fromEmail,
    to: email,
    resetUrl,
  });

  return NextResponse.json({ success: true });
}
