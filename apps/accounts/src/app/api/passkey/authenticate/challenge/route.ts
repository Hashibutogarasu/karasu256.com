import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getServerConfig } from '@/lib/config';

/**
 * Generates a WebAuthn authentication challenge.
 *
 * No `allowCredentials` is set so the authenticator performs a discoverable
 * credential lookup (the user is not required to provide a username).
 * The challenge is stored in an HTTP-only cookie for the verify step.
 *
 * POST /api/passkey/authenticate/challenge
 */
export async function POST() {
  const { webauthn } = getServerConfig();

  const options = await generateAuthenticationOptions({
    rpID: webauthn.rpId,
    userVerification: 'required',
  });

  const cookieStore = await cookies();
  cookieStore.set('passkey_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 300,
    sameSite: 'strict',
    path: '/',
  });

  return NextResponse.json({ options });
}
