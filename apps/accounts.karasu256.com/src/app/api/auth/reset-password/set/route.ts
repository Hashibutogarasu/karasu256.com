import { createHmac, timingSafeEqual } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth } from '@/lib/firebase-admin';
import { RESET_SESSION_COOKIE } from '../verify/route';

const bodySchema = z.object({ password: z.string().min(8) });

/**
 * Verifies the HMAC-signed reset session cookie and returns the encoded uid,
 * or `null` if the token is missing, tampered with, or expired.
 */
function verifyResetSession(token: string): string | null {
  const secret = process.env.AUTH_SECRET ?? '';
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const dotIdx = decoded.lastIndexOf('.');
    if (dotIdx === -1) return null;
    const payload = decoded.slice(0, dotIdx);
    const sig = decoded.slice(dotIdx + 1);

    const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const colonIdx = payload.indexOf(':');
    if (colonIdx === -1) return null;
    const uid = payload.slice(0, colonIdx);
    const expiresAt = parseInt(payload.slice(colonIdx + 1), 10);
    if (Date.now() > expiresAt) return null;

    return uid;
  } catch {
    return null;
  }
}

/**
 * Updates the user's password using the temporary reset session cookie.
 *
 * Requires a valid `password-reset-session` cookie issued by the /verify endpoint.
 * Clears that cookie on success.
 */
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(RESET_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const uid = verifyResetSession(sessionToken);
  if (!uid) {
    return NextResponse.json({ error: 'Invalid or expired reset session' }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  const { password } = parsed.data;

  await getAdminAuth().updateUser(uid, { password });

  const response = NextResponse.json({ success: true });
  response.cookies.set(RESET_SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}
