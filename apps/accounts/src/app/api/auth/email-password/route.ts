import { NextRequest, NextResponse } from "next/server"
import { sql } from "drizzle-orm"
import { getAdminAuth } from "@/lib/firebase-admin"
import { getDb, users } from "@Hashibutogarasu/db"

type SignInBody = { action: "signin"; email: string; password: string }
type RegisterBody = { action: "register"; email: string; password: string }
type RequestBody = SignInBody | RegisterBody

/**
 * Issues a Firebase custom token for email/password authentication.
 *
 * - `action: "signin"` — verifies credentials via the Firebase REST API and
 *   returns a custom token for the resolved UID.
 * - `action: "register"` — creates a new Firebase Auth user via Admin SDK,
 *   upserts the `users` row, and returns a custom token.
 *
 * POST /api/auth/email-password
 * Body: { action, email, password }
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as RequestBody

  if (!body.action || !body.email || !body.password) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 })
  }

  const adminAuth = getAdminAuth()

  if (body.action === "signin") {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: body.email, password: body.password, returnSecureToken: true }),
      },
    )

    const data = (await res.json()) as { localId?: string; error?: { message?: string } }

    if (!res.ok || !data.localId) {
      return NextResponse.json({ error: data.error?.message }, { status: 400 })
    }

    const customToken = await adminAuth.createCustomToken(data.localId)
    return NextResponse.json({ customToken })
  }

  try {
    const newUser = await adminAuth.createUser({ email: body.email, password: body.password })

    const db = getDb()
    await db
      .insert(users)
      .values({ id: newUser.uid })
      .onConflictDoUpdate({ target: users.id, set: { updatedAt: sql`now()` } })

    const customToken = await adminAuth.createCustomToken(newUser.uid)
    return NextResponse.json({ customToken })
  } catch (err) {
    const code = (err as { code?: string }).code
    return NextResponse.json({ error: code }, { status: 400 })
  }
}
