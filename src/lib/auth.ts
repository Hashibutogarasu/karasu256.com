import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebase-admin";

const SESSION_COOKIE_NAME = "session";

/**
 * Reads and verifies the Firebase session cookie issued by accounts.karasu256.com.
 * Returns the decoded token when valid, or `null` when absent or invalid.
 *
 * Must only be called from Server Components or Route Handlers (not Edge runtime).
 */
export async function getSessionUser(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
