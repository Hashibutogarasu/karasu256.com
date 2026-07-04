import { NextResponse } from 'next/server';

/**
 * OAuth scopes an OAuth client may request. Mirrors the scopes declared in
 * `apps/accounts/src/lib/auth/server.ts`'s `oauthProvider({ scopes })` and
 * the `Read()`/`Write()` route guards actually enforced by this app's API
 * routes (currently just `/api/profile`) — update both places together when
 * adding a new scope.
 */
const AVAILABLE_SCOPES = ['read:profile', 'write:profile'];

export async function GET() {
  return NextResponse.json(AVAILABLE_SCOPES);
}
