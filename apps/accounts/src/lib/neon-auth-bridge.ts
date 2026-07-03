import type { DecodedIdToken } from 'firebase-admin/auth';
import { getNeonAuth, deriveNeonAuthPassword } from '@Hashibutogarasu/db';
import { ApiError } from '@Hashibutogarasu/utils/client';

/**
 * Ensures a Neon Auth session exists for the given Firebase user, creating a
 * Neon Auth account on first visit if needed.
 *
 * The password is derived server-side via HMAC and never exposed to clients,
 * so users experience a single sign-in through Firebase only.
 *
 * Must be called from a Route Handler or Server Action where Next.js cookies
 * can be written.
 *
 * @param decoded - Verified Firebase ID token claims.
 */
export async function syncFirebaseUserToNeonAuth(decoded: DecodedIdToken): Promise<void> {
  const email = decoded.email;
  if (!email) return;

  const auth = getNeonAuth();
  const password = deriveNeonAuthPassword(decoded.uid);
  const name = decoded.name ?? email;

  const signInResult = await auth.signIn.email({ email, password });
  if (!signInResult.error) return;

  const signUpResult = await auth.signUp.email({ email, password, name });
  if (signUpResult.error) {
    throw new ApiError(signUpResult.error.status, signUpResult.error.code ?? 'unknown');
  }
}
