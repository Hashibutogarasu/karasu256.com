import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuthSdk } from 'firebase-admin/auth';

const APP_NAME = '@Hashibutogarasu/utils-firebase-admin';

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;
  return initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    },
    APP_NAME
  );
}

/**
 * Returns the shared Firebase Admin Auth instance, initializing it on first
 * call from `FIREBASE_ADMIN_*` environment variables.
 */
export function getAdminAuth() {
  return getAdminAuthSdk(getAdminApp());
}

/**
 * Returns the given user's live Firebase Auth `displayName` and `photoURL`.
 *
 * Unlike a session cookie's decoded claims, this always reflects the
 * current Firebase Auth record, so it stays correct after the user updates
 * their profile without needing to sign in again. Fields are `null` if
 * unset, the user doesn't exist, or `uid` is `null`/`undefined`.
 */
export async function getFirebaseUserProfile(uid: string | null | undefined): Promise<{ displayName: string | null; photoURL: string | null }> {
  if (!uid) {
    return { displayName: null, photoURL: null };
  }
  try {
    const user = await getAdminAuth().getUser(uid);
    return { displayName: user.displayName ?? null, photoURL: user.photoURL ?? null };
  } catch {
    return { displayName: null, photoURL: null };
  }
}
