import type { NextRequest } from "next/server"
import { requireSession } from "@/lib/api/require-session"
import { badRequest, notFound } from "@/lib/api/responses"
import { signIn } from "@/auth"

const SUPPORTED_PROVIDERS = new Set(["google", "github"])

/**
 * Initiates a third-party OAuth connection for the currently signed-in user.
 * Delegates the OAuth flow entirely to NextAuth, which handles PKCE and state
 * automatically. The signIn callback in auth.ts performs the database upsert
 * after the provider redirects back to /api/auth/callback/[provider].
 *
 * Accepts an optional `redirectTo` query parameter (must be a same-origin path
 * starting with `/`) to control where the user lands after linking completes.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { error } = await requireSession()
  if (error) return error

  const { provider: providerId } = await params

  if (!SUPPORTED_PROVIDERS.has(providerId)) {
    return notFound()
  }

  const redirectTo = request.nextUrl.searchParams.get("redirectTo")
  if (!redirectTo?.startsWith("/")) {
    return badRequest()
  }

  await signIn(providerId, { redirectTo })
}
