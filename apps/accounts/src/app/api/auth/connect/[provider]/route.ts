import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api/require-session";
import { getProvider } from "@/lib/providers";
import { buildStateCookie } from "@/lib/providers/oauth-state";

function b64uEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = b64uEncode(verifierBytes.buffer);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = b64uEncode(digest);
  return { verifier, challenge };
}

/**
 * Initiates a third-party OAuth connection for the currently signed-in user.
 * Generates PKCE (for providers that support it), stores state in an encrypted
 * cookie, and redirects the browser to the provider's authorization endpoint.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { provider: providerId } = await params;
  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const state = crypto.randomUUID();
  const usesPkce = providerId === "google";
  const pkce = usesPkce ? await generatePKCE() : null;

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/oauth-callback/${providerId}`;

  const authUrl = provider.buildAuthorizationUrl({
    redirectUri,
    state,
    codeChallenge: pkce?.challenge,
  });

  const cookie = await buildStateCookie({
    state,
    codeVerifier: pkce?.verifier ?? null,
    userId: user.uid,
  });

  return NextResponse.redirect(authUrl, {
    status: 302,
    headers: { "Set-Cookie": cookie },
  });
}
