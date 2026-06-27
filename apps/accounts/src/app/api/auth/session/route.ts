import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { buildSetCookieOptions, SESSION_DURATION_MS } from "@/lib/session";

/**
 * Creates a Firebase session cookie from a client-supplied ID token and stores
 * it as an `httpOnly` cookie, optionally scoped to `BASE_DOMAIN` for
 * cross-subdomain sharing.
 *
 * POST /api/auth/session
 * Body: { idToken: string }
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { idToken?: string };
  if (!body.idToken) {
    return NextResponse.json({ error: "idToken required" }, { status: 400 });
  }

  try {
    const sessionCookie = await getAdminAuth().createSessionCookie(body.idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const store = await cookies();
    store.set(buildSetCookieOptions(sessionCookie));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
