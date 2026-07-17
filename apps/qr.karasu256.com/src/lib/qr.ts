import 'server-only';

import { headers } from 'next/headers';
import { createId } from '@paralleldrive/cuid2';
import QRCode from 'qrcode';
import { useRedis } from '@Hashibutogarasu/ui/redis';
import { embedChallengeToken } from '@Hashibutogarasu/challengetoken';
import {
  MissingEnvError,
  deleteUploadedImage,
  getSessionUser,
  requestChallengeToken,
  uploadImage,
  uploadImageAnonymous,
} from '@Hashibutogarasu/utils/server';

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

/** Returns `NEXT_PUBLIC_IMAGE_API_URL`, throwing {@link MissingEnvError} if it's unset. */
function getImageApiUrl(): string {
  const imageApiUrl = process.env.NEXT_PUBLIC_IMAGE_API_URL;
  if (!imageApiUrl) throw new MissingEnvError('NEXT_PUBLIC_IMAGE_API_URL');
  return imageApiUrl;
}

function redisKeyFor(uid: string | null): string {
  return uid ? `qr:user:${uid}` : 'qr:anonymous';
}

async function readCachedQr(uid: string | null): Promise<CachedQr | null> {
  const cached = await useRedis(process.env.REDIS_URL).get(redisKeyFor(uid));
  return cached ? (JSON.parse(cached) as CachedQr) : null;
}

async function writeCachedQr(uid: string | null, qr: CachedQr): Promise<void> {
  await useRedis(process.env.REDIS_URL).set(redisKeyFor(uid), JSON.stringify(qr), CACHE_TTL_SECONDS);
}

/** Reads the caller's uid and raw `Cookie` request header, or nulls when signed out. */
async function resolveSession(): Promise<{ uid: string | null; cookieHeader: string | null }> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { uid: null, cookieHeader: null };

  const cookieHeader = (await headers()).get('cookie');
  return { uid: sessionUser.uid, cookieHeader };
}

/** Fetches a fresh challenge token from the image API and embeds it into `buffer`'s header, so the CDN can verify this upload round-tripped through it. */
async function embedChallenge(buffer: Buffer): Promise<Buffer> {
  const token = await requestChallengeToken(getImageApiUrl());
  return Buffer.from(embedChallengeToken(buffer, token));
}

async function uploadForUser(buffer: Buffer, uid: string, cookieHeader: string): Promise<{ path: string; url: string }> {
  const embedded = await embedChallenge(buffer);
  const path = `qr/${uid}/${Date.now()}.png`;
  const file = new File([Uint8Array.from(embedded)], 'qr.png', { type: 'image/png' });
  const result = await uploadImage(file, {
    imageApiUrl: getImageApiUrl(),
    cookieHeader,
    path,
  });
  if (!result.ok) throw new Error(`Failed to upload QR image: ${result.error ?? result.status}`);
  return { path, url: result.url };
}

async function uploadAnonymous(buffer: Buffer): Promise<{ path: string; url: string }> {
  const embedded = await embedChallenge(buffer);
  const path = `qr/anonymous/${Date.now()}.png`;
  const result = await uploadImageAnonymous(embedded, {
    apiUrl: getImageApiUrl(),
    path,
    contentType: 'image/png',
  });
  if (!result.ok) throw new Error(`Failed to upload QR image: ${result.error ?? result.status}`);
  return { path, url: result.url };
}

/**
 * Generates a QR for `content` (a fresh random id unless the client already
 * predicted one), uploads it under the caller's path scheme, and replaces
 * the cached entry. The previous-cache read runs in parallel with the R2
 * upload, and the cache write in parallel with the best-effort delete of the
 * previous R2 object; anonymous uploads have no delete credentials and are
 * left for R2 lifecycle rules to expire.
 */
async function generateAndCacheQr(uid: string | null, cookieHeader: string | null, content: string = createId()): Promise<QrData> {
  const buffer = await QRCode.toBuffer(content, { type: 'png', width: QR_IMAGE_WIDTH });

  const [previous, { path, url }] = await Promise.all([
    uid ? readCachedQr(uid) : null,
    uid && cookieHeader ? uploadForUser(buffer, uid, cookieHeader) : uploadAnonymous(buffer),
  ]);

  const qr: CachedQr = { content, path, url, createdAt: new Date().toISOString() };

  await Promise.all([
    writeCachedQr(uid, qr),
    uid && cookieHeader && previous
      ? deleteUploadedImage(previous.url, {
          imageApiUrl: getImageApiUrl(),
          cookieHeader,
        })
      : null,
  ]);

  return { content: qr.content, url: qr.url, createdAt: qr.createdAt };
}

/** Returns the cached QR for the current caller if present, generating and caching a new one otherwise. */
export async function getOrCreateQr(): Promise<QrData> {
  const { uid, cookieHeader } = await resolveSession();
  const cached = await readCachedQr(uid);
  if (cached) return { content: cached.content, url: cached.url, createdAt: cached.createdAt };
  return generateAndCacheQr(uid, cookieHeader);
}

/**
 * Always generates a fresh QR for the current caller, replacing the cached
 * one. When the client already rendered a predicted QR locally, it passes
 * that same `content` so the server-side image encodes identical data.
 */
export async function regenerateQr(content?: string): Promise<QrData> {
  const { uid, cookieHeader } = await resolveSession();
  return generateAndCacheQr(uid, cookieHeader, content);
}
