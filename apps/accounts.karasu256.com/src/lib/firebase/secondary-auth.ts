import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, setPersistence, type Auth } from 'firebase/auth';
import { parseFirebaseEnv } from './schema';

const SECONDARY_APP_NAME = 'add-account';

let secondaryAuth: Auth | undefined;

/**
 * Returns a Firebase Auth instance backed by a second, independently named
 * `FirebaseApp` (same project, `inMemoryPersistence`), so signing in to add
 * another account never touches the default app's `currentUser` or
 * persisted session — the primary tab's login stays completely undisturbed.
 *
 * Safe to call multiple times; subsequent calls return the cached instance.
 */
export function getSecondaryFirebaseAuth(): Auth {
  if (secondaryAuth) return secondaryAuth;

  const existing = getApps().find((app) => app.name === SECONDARY_APP_NAME);
  const app: FirebaseApp = existing ?? initializeApp(parseFirebaseEnv(), SECONDARY_APP_NAME);
  secondaryAuth = getAuth(app);
  void setPersistence(secondaryAuth, inMemoryPersistence);
  return secondaryAuth;
}
