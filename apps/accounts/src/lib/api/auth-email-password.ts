import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { getFirebaseAuth } from "@/lib/firebase/auth"

/**
 * Signs in an existing user with email and password via the Firebase client SDK.
 *
 * @throws {FirebaseError} When authentication fails. Inspect {@link FirebaseError.code} for the cause.
 */
export function signInWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password)
}

/**
 * Creates a new account with email and password via the Firebase client SDK.
 *
 * @throws {FirebaseError} When account creation fails. Inspect {@link FirebaseError.code} for the cause.
 */
export function registerWithEmailPassword(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
}
