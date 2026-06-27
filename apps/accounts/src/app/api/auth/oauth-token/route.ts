import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const OAUTH_CUSTOM_TOKEN_COOKIE = "oauth_custom_token"

/**
 * Returns the short-lived Firebase custom token stored by the OAuth signIn
 * callback, then immediately deletes the cookie. The token is valid for 60
 * seconds; calling this endpoint more than once within that window returns 400.
 *
 * GET /api/auth/oauth-token
 */
export async function GET() {
  const cookieStore = await cookies()
  const customToken = cookieStore.get(OAUTH_CUSTOM_TOKEN_COOKIE)?.value

  if (!customToken) {
    return NextResponse.json({ error: "No pending token" }, { status: 400 })
  }

  cookieStore.delete(OAUTH_CUSTOM_TOKEN_COOKIE)

  return NextResponse.json({ customToken })
}
