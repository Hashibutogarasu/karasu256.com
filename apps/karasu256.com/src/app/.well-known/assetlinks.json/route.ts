import { NextResponse } from 'next/server';
import { vercelProtectionBypassHeaders } from '@Hashibutogarasu/utils/server';

/**
 * Digital Asset Links statements for this host, which is the passkey RP ID,
 * as reported by api.karasu256.com. Responds 502 rather than an empty list
 * when the API is unreachable, so verifiers do not cache a statement list
 * that trusts no app.
 *
 * GET /.well-known/assetlinks.json
 */
export async function GET() {
  try {
    const res = await fetch(`${process.env.API_URL}/asset-links`, {
      headers: vercelProtectionBypassHeaders(process.env.VERCEL_PROTECTION_BYPASS_SECRET),
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  }
}
