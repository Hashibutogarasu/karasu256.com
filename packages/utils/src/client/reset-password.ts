/**
 * Requests a password-reset email for the given address.
 *
 * The server always returns 200 to prevent email enumeration, so this
 * function resolves even when the address is not registered.
 *
 * @throws When the request itself fails (network error or non-200 status).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch("/api/auth/reset-password/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Failed to send reset email");
}

/**
 * Verifies the one-time reset token from the email link and sets a
 * short-lived `password-reset-session` cookie on success.
 *
 * @throws When the token is invalid, already used, or expired.
 */
export async function verifyPasswordResetToken(uid: string, token: string): Promise<void> {
  const res = await fetch("/api/auth/reset-password/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token }),
  });
  if (!res.ok) throw new Error("Invalid or expired token");
}

/**
 * Sets a new password for the user identified by the current
 * `password-reset-session` cookie.
 *
 * @throws When the session is missing or expired, or the password is invalid.
 */
export async function setNewPassword(password: string): Promise<void> {
  const res = await fetch("/api/auth/reset-password/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error("Failed to set password");
}
