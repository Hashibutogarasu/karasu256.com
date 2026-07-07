import { NextResponse } from 'next/server';
import { getOrCreateQr, regenerateQr } from '@/lib/qr';

/** Returns the caller's cached QR, generating and caching one first if none exists yet. Runs on the Node.js runtime, since ioredis requires a raw TCP socket unavailable on the Edge runtime. */
export async function GET() {
  const qr = await getOrCreateQr();
  return NextResponse.json(qr);
}

/**
 * Always generates a fresh QR for the caller, replacing the cached one. The
 * client may supply the QR content it already rendered locally so the synced
 * server-side image encodes the same data; a missing or empty body falls
 * back to server-generated content. Supplied content must match the shape of
 * a cuid2 `createId()` result (a lowercase letter followed by 23 lowercase
 * alphanumerics), which keeps this endpoint from encoding arbitrary attacker
 * chosen payloads (URLs, scripts) into QR images hosted under our domain.
 */
export async function POST(request: Request) {
  let content: string | undefined;
  try {
    const body = (await request.json()) as { content?: unknown };
    if (typeof body.content === 'string') content = body.content;
  } catch {
    content = undefined;
  }

  if (content !== undefined && !/^[a-z][a-z0-9]{23}$/.test(content)) {
    return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
  }

  const qr = await regenerateQr(content);
  return NextResponse.json(qr);
}
