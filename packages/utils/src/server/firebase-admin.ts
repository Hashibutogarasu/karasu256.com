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
 * Returns the given user's Firebase Auth `photoURL`, or `null` if the user
 * has none set or doesn't exist.
 */
export async function getFirebaseUserIcon(uid: string): Promise<string | null> {
  try {
    const user = await getAdminAuth().getUser(uid);
    return user.photoURL ?? null;
  } catch {
    return null;
  }
}
