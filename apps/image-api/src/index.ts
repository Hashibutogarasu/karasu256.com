import { importX509, jwtVerify } from 'jose';
import { z } from 'zod';
import { stringOrNull } from '@Hashibutogarasu/utils/validation';
import allowedOrigins from './allowed-origins.json';

interface Env {
  IMAGES: R2Bucket;
  FIREBASE_PROJECT_ID: string;
  CDN_BASE_URL: string;
  RATE_LIMIT_KV: KVNamespace;
}

const SESSION_COOKIE_NAME = 'session';
const SESSION_COOKIE_KEYS_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

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

/**
 * Resolves the CORS origin to reflect back: whichever entry of
 * `allowed-origins.json` matches the request, or the request's own origin
 * when it's a loopback address. Reflecting a loopback origin is safe
 * regardless of its port, and lets `wrangler dev` work against a local dev
 * server without any environment-specific configuration.
 */
function resolveAllowedOrigin(requestOrigin: string | null): string {
  if (requestOrigin) {
    try {
      const hostname = new URL(requestOrigin).hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return requestOrigin;
    } catch {
      return allowedOrigins[0];
    }
    if (allowedOrigins.includes(requestOrigin)) return requestOrigin;
  }

  return allowedOrigins[0];
}

/**
 * Checks whether an explicit upload path matches one of the known key
 * schemes. `users/:uid/avatar.png` additionally requires the `:uid` segment
 * to match the authenticated caller, since the worker has no other way to
 * stop one user from overwriting another user's avatar.
 */
function isValidUploadPath(path: string, uid: string): boolean {
  const avatarMatch = path.match(/^users\/([^/]+)\/avatar\.png$/);
  if (avatarMatch) return avatarMatch[1] === uid;

  const qrMatch = path.match(/^qr\/([^/]+)\/(\d+)\.png$/);
  if (qrMatch) return qrMatch[1] === uid;

  return /^oauth\/([^/]+)\/icon\.png$/.test(path);
}

/**
 * Checks whether an anonymous upload path matches the fixed
 * `qr/anonymous/{datetime}.png` scheme, since anonymous callers have no uid
 * to scope a path to.
 */
function isValidAnonymousUploadPath(path: string): boolean {
  return /^qr\/anonymous\/\d+\.png$/.test(path);
}

/**
 * Approximates a per-IP request count over a rolling hour using a
 * read-then-write KV counter keyed by the current hour bucket. Cloudflare's
 * native rate limiting binding only supports 10s/60s windows, unsuitable for
 * an hourly quota, so this accepts a small race-condition margin of error in
 * exchange for a simple hourly counter.
 */
async function checkAndIncrementRateLimit(ip: string, env: Env, limit = 500, windowSeconds = 3600, kvTtlSeconds = 3700): Promise<boolean> {
  const hourBucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `ratelimit:anon:${ip}:${hourBucket}`;
  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) ?? '0', 10);
  if (current >= limit) return false;

  await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: kvTtlSeconds });
  return true;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
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
async function requireUid(request: Request, env: Env): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = parseCookies(cookieHeader);
  const sessionCookie = cookies[SESSION_COOKIE_NAME];
  if (!sessionCookie) return null;
  return verifySessionCookie(sessionCookie, env.FIREBASE_PROJECT_ID);
}

function json(body: unknown, status: number, extra: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}

/**
 * Serves a previously uploaded image from R2 by its object key, so that the
 * URL returned from `/upload` is actually loadable (e.g. as an `<img>` src).
 */
async function serveImage(pathname: string, env: Env): Promise<Response> {
  const key = pathname.slice(1);
  if (!key) {
    return new Response('Not Found', { status: 404 });
  }

  const object = await env.IMAGES.get(key);
  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, { headers });
}

/**
 * Deletes a previously uploaded image from R2 by its object key. Used to
 * clean up a user's or OAuth client's old icon once a new one has replaced
 * it.
 */
async function deleteImage(pathname: string, request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const key = pathname.slice(1);
  if (!key) return json({ error: 'Not Found' }, 404, cors);

  const uid = await requireUid(request, env);
  if (!uid) return json({ error: 'Unauthorized' }, 401, cors);

  await env.IMAGES.delete(key);
  return new Response(null, { status: 204, headers: cors });
}

/**
 * Handles unauthenticated uploads restricted to the `qr/anonymous/{datetime}.png`
 * path scheme, rate-limited per IP since there is no uid to scope abuse to.
 */
async function handleAnonymousUpload(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return json({ error: 'Bad Request' }, 400, cors);

  const allowed = await checkAndIncrementRateLimit(ip, env);
  if (!allowed) {
    return json({ error: 'Rate limit exceeded' }, 429, { ...cors, 'Retry-After': '3600' });
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Expected multipart/form-data' }, 400, cors);
  }

  const formData = await request.formData();
  const fileResult = z.instanceof(File).safeParse(formData.get('file'));
  if (!fileResult.success) {
    return json({ error: 'Missing file field' }, 400, cors);
  }
  const file = fileResult.data;

  const path = stringOrNull(formData.get('path'));
  if (!path || !isValidAnonymousUploadPath(path)) {
    return json({ error: 'Invalid upload path' }, 400, cors);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ error: 'Unsupported image type. Allowed: jpeg, png, webp.' }, 400, cors);
  }

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength > MAX_FILE_BYTES) {
    return json({ error: 'File exceeds 5 MB limit' }, 413, cors);
  }

  await env.IMAGES.put(path, buffer, {
    httpMetadata: { contentType: file.type },
  });

  return json({ url: `${env.CDN_BASE_URL}/${path}` }, 200, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(resolveAllowedOrigin(request.headers.get('Origin')));

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const requestUrl = new URL(request.url);
    const { pathname } = requestUrl;

    if (request.method === 'GET') {
      return serveImage(pathname, env);
    }

    if (request.method === 'DELETE') {
      return deleteImage(pathname, request, env, cors);
    }

    if (pathname === '/upload/anonymous' && request.method === 'POST') {
      return handleAnonymousUpload(request, env, cors);
    }

    if (pathname !== '/upload' || request.method !== 'POST') {
      return json({ error: 'Not Found' }, 404, cors);
    }

    const uid = await requireUid(request, env);
    if (!uid) {
      return json({ error: 'Unauthorized' }, 401, cors);
    }

    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return json({ error: 'Expected multipart/form-data' }, 400, cors);
    }

    const formData = await request.formData();
    const fileResult = z.instanceof(File).safeParse(formData.get('file'));
    if (!fileResult.success) {
      return json({ error: 'Missing file field' }, 400, cors);
    }
    const file = fileResult.data;

    const explicitPath = stringOrNull(formData.get('path')) || null;
    if (explicitPath && !isValidUploadPath(explicitPath, uid)) {
      return json({ error: 'Invalid upload path' }, 400, cors);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return json({ error: 'Unsupported image type. Allowed: jpeg, png, webp.' }, 400, cors);
    }

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_FILE_BYTES) {
      return json({ error: 'File exceeds 5 MB limit' }, 413, cors);
    }

    const ext = TYPE_TO_EXT[file.type];
    const key = explicitPath ?? `users/${uid}/images/${crypto.randomUUID()}.${ext}`;
    await env.IMAGES.put(key, buffer, {
      httpMetadata: { contentType: file.type },
    });

    return json({ url: `${env.CDN_BASE_URL}/${key}` }, 200, cors);
  },
} satisfies ExportedHandler<Env>;
