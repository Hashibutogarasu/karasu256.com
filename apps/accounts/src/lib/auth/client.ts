import { createAuthClient } from 'better-auth/react';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';

export const authClient = createAuthClient({
  plugins: [oauthProviderClient()],
});

/**
 * Calls the Firebase session bridge (`FIREBASE_BRIDGE_PATH` in
 * `firebase-bridge-plugin.ts`) to synthesize a better-auth session for the
 * current Firebase user. A JSON content type is required even though there's
 * no meaningful body — better-call's router 415s POST requests it can't
 * classify a media type for.
 */
export async function callFirebaseBridge(): Promise<void> {
  await fetch('/api/auth/firebase-bridge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
