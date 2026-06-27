import type { Auth } from "firebase-admin/auth"

/** Name of the Firebase session cookie shared across subdomains. */
export const SESSION_COOKIE_NAME = "session"

/** Name of the NextAuth JWT cookie shared across subdomains. */
export const AUTH_TOKEN_COOKIE_NAME = "karasu-auth-token"

/**
 * Returns a NextAuth `authorize` function that verifies a Firebase ID token
 * and returns the mapped user object on success, or `null` on failure.
 *
 * @param adminAuth - Firebase Admin Auth instance for ID token verification.
 */
export function makeFirebaseAuthorize(adminAuth: Auth) {
  return async function authorize(credentials: Record<string, unknown> | null | undefined) {
    const idToken = credentials?.idToken
    if (typeof idToken !== "string" || !idToken) return null
    try {
      const decoded = await adminAuth.verifyIdToken(idToken)
      return {
        id: decoded.uid,
        email: decoded.email ?? null,
        name: decoded.name ?? null,
        image: decoded.picture ?? null,
      }
    } catch {
      return null
    }
  }
}

/**
 * Returns NextAuth `cookies` config that scopes the JWT cookie to
 * `.{baseDomain}` for cross-subdomain session sharing.
 *
 * @param baseDomain - Root domain (e.g. "karasu256.com"). Omit in development.
 */
export function makeNextAuthCookies(baseDomain?: string) {
  const secure = process.env.NODE_ENV === "production"
  const domain = baseDomain ? `.${baseDomain}` : undefined
  return {
    sessionToken: {
      name: AUTH_TOKEN_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure,
        ...(domain ? { domain } : {}),
      },
    },
  }
}
