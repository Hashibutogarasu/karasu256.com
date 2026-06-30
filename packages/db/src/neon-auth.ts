import { createNeonAuth } from "@neondatabase/auth/next/server";
import { createHmac } from "crypto";

let _neonAuth: ReturnType<typeof createNeonAuth> | undefined;

/**
 * Returns a singleton Neon Auth server instance configured from environment variables.
 *
 * Requires {@link process.env.NEON_AUTH_BASE_URL} and
 * {@link process.env.NEON_AUTH_COOKIE_SECRET} to be set.
 */
export function getNeonAuth(): ReturnType<typeof createNeonAuth> {
  if (!_neonAuth) {
    _neonAuth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        secret: process.env.AUTH_SECRET!,
      },
    });
  }
  return _neonAuth;
}

/**
 * Derives a stable, server-only Neon Auth password for a Firebase user.
 *
 * The password is never stored or exposed to clients — it exists solely to
 * bridge a verified Firebase session into a Neon Auth session without
 * requiring the user to complete a second sign-in flow.
 *
 * @param firebaseUid - The Firebase UID of the authenticated user.
 */
export function deriveNeonAuthPassword(firebaseUid: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET!)
    .update(firebaseUid)
    .digest("hex");
}
