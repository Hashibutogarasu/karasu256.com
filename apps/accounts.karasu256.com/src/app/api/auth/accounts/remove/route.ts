import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/server';
import { buildClearCookieOptions } from '@/lib/session';
import { getSessionUser } from '@/lib/session-user';
import { handlePreflight, withCors } from '@/lib/auth/cors';
import { forwardSetCookies } from '@/lib/auth/forward-set-cookies';

const bodySchema = z.object({ sessionToken: z.string().min(1) });

/**
 * Removes an account from this device: revokes its bridged better-auth
 * session (dropping it from the `multiSession` device list). If it was the
 * currently active account, the live `SESSION_COOKIE_NAME` cookie is cleared
 * outright rather than silently promoting another account, so the user
 * explicitly picks who to sign in as next.
 *
 * POST /api/auth/accounts/remove
 * Body: { sessionToken: string }
 */
async function handlePOST(request: NextRequest) {
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'sessionToken required' }, { status: 400 });
  }
  const { sessionToken } = parsedBody.data;

  const deviceSessions = await auth.api.listDeviceSessions({ headers: request.headers });
  const target = deviceSessions.find((entry) => entry.session.token === sessionToken);
  if (!target) {
    return NextResponse.json({ error: 'Unknown session' }, { status: 403 });
  }

  const activeUser = await getSessionUser();
  const wasActive = activeUser?.id === target.user.id;

  const revokeResponse = await auth.api.revokeDeviceSession({
    headers: request.headers,
    body: { sessionToken },
    asResponse: true,
  });

  const response = NextResponse.json({ ok: true });
  forwardSetCookies(revokeResponse, response);

  if (wasActive) {
    const store = await cookies();
    store.set(buildClearCookieOptions());
  }

  return response;
}

export const POST = withCors(handlePOST);
export const OPTIONS = handlePreflight;
