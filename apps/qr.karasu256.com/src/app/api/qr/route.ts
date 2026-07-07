import { NextResponse } from 'next/server';
import { getOrCreateQr, regenerateQr } from '@/lib/qr';

/** Returns the caller's cached QR, generating and caching one first if none exists yet. Runs on the Node.js runtime, since ioredis requires a raw TCP socket unavailable on the Edge runtime. */
export async function GET() {
  const qr = await getOrCreateQr();
  return NextResponse.json(qr);
}

/** Always generates a fresh QR for the caller, replacing the cached one. */
export async function POST() {
  const qr = await regenerateQr();
  return NextResponse.json(qr);
}
