import { ApiError } from "@Hashibutogarasu/utils/client";

/**
 * Creates a server-side session cookie from a Firebase ID token.
 *
 * @throws {ApiError} When the server rejects the token.
 */
export async function createSession(idToken: string): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) throw ApiError.fromResponse(res);
}

/** Clears the server-side session cookie. */
export async function clearSession(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}
