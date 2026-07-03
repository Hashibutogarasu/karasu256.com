import type { NextRequest } from 'next/server';
import { notFound } from '@/lib/api/responses';
import { signIn } from '@/auth';

const SUPPORTED_PROVIDERS = new Set(['google', 'github']);

/**
 * Initiates a third-party OAuth sign-in flow for unauthenticated users.
 * Unlike the account-linking connect route, this does not require an existing
 * session. After the OAuth callback, the signIn handler in auth.ts creates a
 * Firebase user (or finds an existing one by email), issues a custom token
 * stored in a short-lived cookie, and redirects to /auth/callback.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;

  if (!SUPPORTED_PROVIDERS.has(provider)) {
    return notFound();
  }

  await signIn(provider, { redirectTo: '/auth/callback' });
}
