import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth as getAdminAuthSdk } from "firebase-admin/auth";

const APP_NAME = "karasu-web-admin";

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;
  return initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      }),
    },
    APP_NAME,
  );
}

/**
 * Returns the Firebase Admin Auth instance for karasu-web.
 * Initializes the named app on first call using server-side environment variables.
 * Uses a distinct app name to avoid collisions with apps/accounts in the same process.
 */
export function getAdminAuth() {
  return getAdminAuthSdk(getAdminApp());
}
