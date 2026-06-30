import type { NextRequest } from "next/server"

/**
 * Reads the `next` query parameter from a request and validates it is a
 * same-origin path (must start with `/`). Returns null when absent or invalid.
 */
export function getNextParam(request: NextRequest): string | null {
  const next = request.nextUrl.searchParams.get("next")
  return next?.startsWith("/") ? next : null
}

/**
 * Builds the URL for the OAuth provider connect endpoint with a post-link
 * redirect target encoded as the `next` query parameter.
 */
export function buildConnectUrl(providerId: string, next: string): string {
  return `/api/auth/connect/${providerId}?next=${encodeURIComponent(next)}`
}
