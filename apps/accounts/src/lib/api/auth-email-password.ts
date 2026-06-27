/**
 * Signs in an existing user with email and password.
 * Delegates credential verification to the server and returns a Firebase
 * custom token to pass to `signInWithCustomToken`.
 *
 * @throws When the server rejects the credentials.
 */
export async function signInWithEmailPassword(email: string, password: string): Promise<string> {
  const res = await fetch("/api/auth/email-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signin", email, password }),
  })
  const data = (await res.json()) as { customToken?: string; error?: string }
  if (data.error) throw new Error(data.error)
  if (!data.customToken) throw new Error("No custom token returned")
  return data.customToken
}

/**
 * Creates a new account with email and password.
 * The account is created server-side via Admin SDK and a Firebase custom token
 * is returned to pass to `signInWithCustomToken`.
 *
 * @throws When the server rejects the registration (e.g. email already in use).
 */
export async function registerWithEmailPassword(email: string, password: string): Promise<string> {
  const res = await fetch("/api/auth/email-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", email, password }),
  })
  const data = (await res.json()) as { customToken?: string; error?: string }
  if (data.error) throw new Error(data.error)
  if (!data.customToken) throw new Error("No custom token returned")
  return data.customToken
}
