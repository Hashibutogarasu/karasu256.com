import 'server-only';

import { cookies } from 'next/headers';
import { createId } from '@paralleldrive/cuid2';
import QRCode from 'qrcode';
import { useRedis } from '@Hashibutogarasu/ui';
import { SESSION_COOKIE_NAME, deleteUploadedImage, getSessionUser, uploadImage, uploadImageAnonymous } from '@Hashibutogarasu/utils/server';

const QR_IMAGE_WIDTH = 512;
const CACHE_TTL_SECONDS = 60 * 60 * 24;

export interface QrData {
  content: string;
  url: string;
  createdAt: string;
}

interface CachedQr extends QrData {
  path: string;
}

function redisKeyFor(uid: string | null): string {
  return uid ? `qr:user:${uid}` : 'qr:anonymous';
}

async function readCachedQr(uid: string | null): Promise<CachedQr | null> {
  const cached = await useRedis().get(redisKeyFor(uid));
  return cached ? (JSON.parse(cached) as CachedQr) : null;
}

async function writeCachedQr(uid: string | null, qr: CachedQr): Promise<void> {
  await useRedis().set(redisKeyFor(uid), JSON.stringify(qr), CACHE_TTL_SECONDS);
}

/** Reads the caller's Firebase uid and raw session cookie, or nulls when signed out. */
async function resolveSession(): Promise<{ uid: string | null; sessionCookie: string | null }> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { uid: null, sessionCookie: null };

  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
  return { uid: sessionUser.uid, sessionCookie };
}

async function uploadForUser(buffer: Buffer, uid: string, sessionCookie: string): Promise<{ path: string; url: string }> {
  const path = `qr/${uid}/${Date.now()}.png`;
  const file = new File([buffer], 'qr.png', { type: 'image/png' });
  const result = await uploadImage(file, {
    imageApiUrl: process.env.NEXT_PUBLIC_IMAGE_API_URL!,
    sessionCookie,
    path,
  });
  if (!result.ok) throw new Error(`Failed to upload QR image: ${result.error ?? result.status}`);
  return { path, url: result.url };
}

async function uploadAnonymous(buffer: Buffer): Promise<{ path: string; url: string }> {
  const path = `qr/anonymous/${Date.now()}.png`;
  const result = await uploadImageAnonymous(buffer, {
    apiUrl: process.env.NEXT_PUBLIC_IMAGE_API_URL!,
    path,
    contentType: 'image/png',
  });
  if (!result.ok) throw new Error(`Failed to upload QR image: ${result.error ?? result.status}`);
  return { path, url: result.url };
}

/**
 * Generates a new random QR, uploads it under the caller's path scheme, and
 * replaces the cached entry. For signed-in callers, the previous R2 object
 * is deleted on a best-effort basis; anonymous uploads have no delete
 * credentials and are left for R2 lifecycle rules to expire.
 */
async function generateAndCacheQr(uid: string | null, sessionCookie: string | null): Promise<QrData> {
  const content = createId();
  const buffer = await QRCode.toBuffer(content, { type: 'png', width: QR_IMAGE_WIDTH });

  const previous = uid ? await readCachedQr(uid) : null;

  const { path, url } = uid && sessionCookie ? await uploadForUser(buffer, uid, sessionCookie) : await uploadAnonymous(buffer);

  const qr: CachedQr = { content, path, url, createdAt: new Date().toISOString() };
  await writeCachedQr(uid, qr);

  if (uid && sessionCookie && previous) {
    await deleteUploadedImage(previous.url, {
      imageApiUrl: process.env.NEXT_PUBLIC_IMAGE_API_URL!,
      sessionCookie,
    });
  }

  return { content: qr.content, url: qr.url, createdAt: qr.createdAt };
}

/** Returns the cached QR for the current caller if present, generating and caching a new one otherwise. */
export async function getOrCreateQr(): Promise<QrData> {
  const { uid, sessionCookie } = await resolveSession();
  const cached = await readCachedQr(uid);
  if (cached) return { content: cached.content, url: cached.url, createdAt: cached.createdAt };
  return generateAndCacheQr(uid, sessionCookie);
}

/** Always generates a fresh QR for the current caller, replacing the cached one. */
export async function regenerateQr(): Promise<QrData> {
  const { uid, sessionCookie } = await resolveSession();
  return generateAndCacheQr(uid, sessionCookie);
}
