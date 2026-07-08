import allowedOrigins from '../allowed-origins.json';

/**
 * Determines whether the CORS plugin should reflect the request's Origin
 * header back to the caller: true when it exactly matches an entry in
 * allowed-origins.json, or when it's a loopback address, since reflecting a
 * loopback origin is safe regardless of its port and lets `wrangler dev`
 * work against a local dev server without any environment-specific
 * configuration.
 */
export function isAllowedOrigin(request: Request): boolean {
  const requestOrigin = request.headers.get('Origin');
  if (!requestOrigin) return false;

  try {
    const hostname = new URL(requestOrigin).hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  } catch {
    return false;
  }

  return allowedOrigins.includes(requestOrigin);
}
