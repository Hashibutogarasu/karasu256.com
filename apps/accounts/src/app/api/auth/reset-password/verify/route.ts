import { createHash, createHmac } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, passwordResetTokens } from "@Hashibutogarasu/db";

/** Name of the short-lived cookie set after a successful token verification. */
export const RESET_SESSION_COOKIE = "password-reset-session";

/** Duration of the temporary reset session: 15 minutes. */
const RESET_SESSION_MS = 15 * 60 * 1000;

/**
 * Creates an HMAC-signed session token encoding the user's uid and expiry.
 * The token is later verified by the /set endpoint before updating the password.
 */
export function signResetSession(uid: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  const expiresAt = Date.now() + RESET_SESSION_MS;
  const payload = `${uid}:${expiresAt}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

/**
 * Verifies the one-time password-reset token from the email link.
 *
 * On success:
 * - Deletes the token row from PostgreSQL so it cannot be reused.
 * - Sets a short-lived `password-reset-session` cookie.
 */
export async function POST(request: NextRequest) {
  let uid: string, token: string;
  try {
    ({ uid, token } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!uid || !token || typeof uid !== "string" || typeof token !== "string") {
    return NextResponse.json({ error: "uid and token are required" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = getDb();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  if (row.userId !== uid) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));

  if (row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Token has expired" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(RESET_SESSION_COOKIE, signResetSession(uid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: RESET_SESSION_MS / 1000,
  });
  return response;
}
