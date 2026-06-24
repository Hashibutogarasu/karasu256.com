import { importX509, jwtVerify } from "jose";

interface Env {
  IMAGES: R2Bucket;
  ALLOWED_ORIGIN: string;
  CDN_BASE_URL: string;
  FIREBASE_PROJECT_ID: string;
}

const SESSION_COOKIE_NAME = "session";
const SESSION_COOKIE_KEYS_URL =
  "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let cachedKeys: Map<string, CryptoKey> | null = null;
let cacheExpiry = 0;

async function fetchPublicKeys(): Promise<Map<string, CryptoKey>> {
  const now = Date.now();
  if (cachedKeys && now < cacheExpiry) return cachedKeys;

  const res = await fetch(SESSION_COOKIE_KEYS_URL);
  const cacheControl = res.headers.get("cache-control") ?? "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3_600_000;

  const certs = (await res.json()) as Record<string, string>;
  const keys = new Map<string, CryptoKey>();
  for (const [kid, pem] of Object.entries(certs)) {
    keys.set(kid, await importX509(pem, "RS256"));
  }

  cachedKeys = keys;
  cacheExpiry = now + maxAge;
  return keys;
}

/**
 * Verifies a Firebase session cookie and returns the Firebase UID on success,
 * or null if the token is absent, expired, or has an invalid signature.
 */
async function verifySessionCookie(
  cookie: string,
  projectId: string,
): Promise<string | null> {
  try {
    const keys = await fetchPublicKeys();
    const [headerB64] = cookie.split(".");
    const header = JSON.parse(
      atob(headerB64.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { kid?: string };
    if (!header.kid) return null;
    const key = keys.get(header.kid);
    if (!key) return null;

    const { payload } = await jwtVerify(cookie, key, {
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header
      .split(";")
      .map((c) => c.trim().split("=", 2) as [string, string])
      .filter(([k]) => k.length > 0)
      .map(([k, v]) => [k.trim(), decodeURIComponent((v ?? "").trim())]),
  );
}

function json(
  body: unknown,
  status: number,
  extra: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const { pathname } = new URL(request.url);

    if (pathname !== "/upload" || request.method !== "POST") {
      return json({ error: "Not Found" }, 404, cors);
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies[SESSION_COOKIE_NAME];
    if (!sessionCookie) {
      return json({ error: "Unauthorized" }, 401, cors);
    }

    const uid = await verifySessionCookie(sessionCookie, env.FIREBASE_PROJECT_ID);
    if (!uid) {
      return json({ error: "Unauthorized" }, 401, cors);
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ error: "Expected multipart/form-data" }, 400, cors);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | string | null;
    if (!file || typeof file === "string") {
      return json({ error: "Missing file field" }, 400, cors);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return json(
        { error: "Unsupported image type. Allowed: jpeg, png, webp." },
        400,
        cors,
      );
    }

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_FILE_BYTES) {
      return json({ error: "File exceeds 5 MB limit" }, 413, cors);
    }

    const ext = TYPE_TO_EXT[file.type];
    const key = `${crypto.randomUUID()}.${ext}`;
    await env.IMAGES.put(key, buffer, {
      httpMetadata: { contentType: file.type },
    });

    return json({ url: `${env.CDN_BASE_URL}/${key}` }, 200, cors);
  },
} satisfies ExportedHandler<Env>;
