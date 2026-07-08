import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth } from '@/lib/firebase-admin';
import { auth } from '@/lib/auth/server';
import { SESSION_DURATION_MS } from '@/lib/session';
import { handlePreflight, withCors } from '@/lib/auth/cors';
import { forwardSetCookies } from '@/lib/auth/forward-set-cookies';

const bodySchema = z.object({ idToken: z.string().min(1) });

/**
 * Bridges an additional Firebase account into this device's `multiSession`
 * list, without disturbing the currently active Firebase session cookie —
 * the caller (the add-account dialog, signed in via a secondary Firebase
 * Auth instance) never writes this account's cookie to the browser itself.
 *
 * POST /api/auth/accounts/add
 * Body: { idToken: string }
 */
async function handlePOST(request: NextRequest) {
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'idToken required' }, { status: 400 });
  }

  let firebaseSessionCookie: string;
  try {
    firebaseSessionCookie = await getAdminAuth().createSessionCookie(parsedBody.data.idToken, {
      expiresIn: SESSION_DURATION_MS,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const bridgeResponse = await auth.api.firebaseBridgeAdd({
    headers: request.headers,
    body: { firebaseSessionCookie },
    asResponse: true,
  });
  const bridgeResult = (await bridgeResponse.json()) as { ok: boolean; uid?: string; sessionToken?: string };
  if (!bridgeResult.ok) {
    return NextResponse.json({ error: 'Bridge failed' }, { status: 401 });
  }

  const response = NextResponse.json(bridgeResult);
  forwardSetCookies(bridgeResponse, response);
  return response;
}

export const POST = withCors(handlePOST);
export const OPTIONS = handlePreflight;
