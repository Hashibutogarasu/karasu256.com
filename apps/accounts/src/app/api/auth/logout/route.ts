import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildClearCookieOptions } from "@/lib/session";
import { getServerConfig } from "@/lib/config";
import { AUTH_TOKEN_COOKIE_NAME } from "@Hashibutogarasu/utils/server";

/**
 * Clears both the Firebase session cookie and the NextAuth JWT cookie.
 *
 * Both cookies must be cleared with the same `Domain` and `Path` attributes
 * used when setting them.
 *
 * POST /api/auth/logout
 */
export async function POST() {
  const { baseDomain } = getServerConfig();
  const store = await cookies();

  store.set(buildClearCookieOptions());

  store.set({
    name: AUTH_TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(baseDomain ? { domain: `.${baseDomain}` } : {}),
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
