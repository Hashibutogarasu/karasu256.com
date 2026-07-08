import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, type CipherGCMTypes } from 'node:crypto';

/**
 * Derives the AES-256-GCM key from `BETTER_AUTH_SECRET` via HKDF, rather than
 * requiring a separate dedicated env var — `BETTER_AUTH_SECRET` is already
 * the one long-lived secret this app manages, and HKDF's `info` parameter
 * keeps this key cryptographically independent of any other purpose that
 * same secret is used for.
 */
function getCipherKey(info = 'firebase-bridge-cookie-encryption'): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET is not set');
  }
  return Buffer.from(hkdfSync('sha256', secret, '', info, 32));
}

/**
 * Encrypts a Firebase session cookie value for storage on a bridged
 * better-auth session row, so it can be restored on account switch.
 *
 * Ciphertext format (base64): `iv || authTag || encrypted`.
 */
export function encryptFirebaseCookie(cookie: string, algorithm: CipherGCMTypes = 'aes-256-gcm', ivLength = 12): string {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, getCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(cookie, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypts a value produced by {@link encryptFirebaseCookie}.
 */
export function decryptFirebaseCookie(enc: string, algorithm: CipherGCMTypes = 'aes-256-gcm', ivLength = 12): string {
  const raw = Buffer.from(enc, 'base64');
  const iv = raw.subarray(0, ivLength);
  const authTag = raw.subarray(ivLength, ivLength + 16);
  const encrypted = raw.subarray(ivLength + 16);
  const decipher = createDecipheriv(algorithm, getCipherKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
