import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getAdminAuth } from "@/lib/firebase-admin";
import { getDb, users } from "@Hashibutogarasu/db";
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
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(body.idToken);
    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const store = await cookies();
    store.set(buildSetCookieOptions(sessionCookie));

    const db = getDb();
    await db
      .insert(users)
      .values({ id: decoded.uid })
      .onConflictDoUpdate({ target: users.id, set: { updatedAt: sql`now()` } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
