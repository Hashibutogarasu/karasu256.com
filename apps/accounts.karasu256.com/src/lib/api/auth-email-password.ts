import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type Auth } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/auth';

/**
 * Signs in an existing user with email and password via the Firebase client SDK.
 *
 * @param auth Firebase Auth instance to sign in against. Defaults to the app's
 * primary instance; pass the secondary instance from `secondary-auth.ts` when
 * adding another account without disturbing the current tab's session.
 * @throws {FirebaseError} When authentication fails. Inspect {@link FirebaseError.code} for the cause.
 */
export function signInWithEmailPassword(email: string, password: string, auth: Auth = getFirebaseAuth()) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Creates a new account with email and password via the Firebase client SDK.
 *
 * @param auth Firebase Auth instance to register against. Defaults to the app's
 * primary instance; pass the secondary instance from `secondary-auth.ts` when
 * adding another account without disturbing the current tab's session.
 * @throws {FirebaseError} When account creation fails. Inspect {@link FirebaseError.code} for the cause.
 */
export function registerWithEmailPassword(email: string, password: string, auth: Auth = getFirebaseAuth()) {
  return createUserWithEmailAndPassword(auth, email, password);
}
