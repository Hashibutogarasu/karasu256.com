import { createAuthClient } from 'better-auth/react';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_ACCOUNTS_URL,
  plugins: [oauthProviderClient()],
});

/**
 * Ensures the browser holds a better-auth session for the current Firebase
 * user before calling any session-gated `authClient.oauth2.*` endpoint.
 * karasu256.com only ever has a Firebase session on its own; better-auth's
 * session lives on accounts.karasu256.com and is synthesized on demand by
 * its `/api/auth/firebase-bridge` endpoint.
 */
export async function bridgeFirebaseSession(): Promise<void> {
  await fetch(`${process.env.NEXT_PUBLIC_ACCOUNTS_URL}/api/auth/firebase-bridge`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
