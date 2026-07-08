import { importX509, jwtVerify } from 'jose';
import { stringOrNull } from '@Hashibutogarasu/utils/validation';

const SESSION_COOKIE_NAME = 'session';
const SESSION_COOKIE_KEYS_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';

let cachedKeys: Map<string, CryptoKey> | null = null;
let cacheExpiry = 0;

async function fetchPublicKeys(): Promise<Map<string, CryptoKey>> {
  const now = Date.now();
  if (cachedKeys && now < cacheExpiry) return cachedKeys;

  const res = await fetch(SESSION_COOKIE_KEYS_URL);
  const cacheControl = res.headers.get('cache-control') ?? '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3_600_000;

  const certs = (await res.json()) as Record<string, string>;
  const keys = new Map<string, CryptoKey>();
  for (const [kid, pem] of Object.entries(certs)) {
    keys.set(kid, await importX509(pem, 'RS256'));
  }

  cachedKeys = keys;
  cacheExpiry = now + maxAge;
  return keys;
}

/**
 * Verifies a Firebase session cookie and returns the Firebase UID on success,
 * or null if the token is absent, expired, or has an invalid signature.
 */
async function verifySessionCookie(cookie: string, projectId: string): Promise<string | null> {
  try {
    const keys = await fetchPublicKeys();
    const [headerB64] = cookie.split('.');
    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'))) as { kid?: string };
    if (!header.kid) return null;
    const key = keys.get(header.kid);
    if (!key) return null;

    const { payload } = await jwtVerify(cookie, key, {
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
    });
    return stringOrNull(payload.sub);
  } catch {
    return null;
  }
}

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header
      .split(';')
      .map((c) => c.trim().split('=', 2) as [string, string])
      .filter(([k]) => k.length > 0)
      .map(([k, v]) => [k.trim(), decodeURIComponent((v ?? '').trim())])
  );
}

/**
 * Verifies the Firebase session cookie on the request and returns the
 * caller's UID, or null when the cookie is missing or invalid.
 */
export async function requireUid(request: Request, env: Env): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  if (!sessionCookie) return null;
  return verifySessionCookie(sessionCookie, env.FIREBASE_PROJECT_ID);
}
