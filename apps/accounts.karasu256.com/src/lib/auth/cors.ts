import { NextResponse, type NextRequest } from 'next/server';

/**
 * better-auth only uses `trustedOrigins` for its own cookie/CSRF origin
 * checks — it never emits `Access-Control-*` response headers, so
 * cross-origin calls from karasu256.com (e.g. the Firebase session bridge,
 * `/oauth2/*` client management) are blocked by the browser without this.
 */
const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_APP_URL].filter((v): v is string => !!v);

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

/** Answers a CORS preflight request for the given origin. */
export function handlePreflight(request: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

/** Wraps a route handler, adding CORS headers to its response for trusted cross-origin callers. */
export function withCors(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const response = await handler(request);
    const headers = corsHeaders(request.headers.get('origin'));
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
    return response;
  };
}
