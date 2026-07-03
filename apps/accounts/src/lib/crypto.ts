const IV_LENGTH = 12;

function b64uEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64uDecode(s: string): Uint8Array {
  const padded = s
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(s.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('TOKEN_ENCRYPTION_KEY is not set');
  const keyBytes = b64uDecode(raw);
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * Encrypts a plaintext string with AES-256-GCM using TOKEN_ENCRYPTION_KEY.
 * Returns a "<iv_b64url>.<ciphertext_b64url>" string suitable for database storage.
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return `${b64uEncode(iv.buffer)}.${b64uEncode(ciphertext)}`;
}

/**
 * Decrypts a "<iv_b64url>.<ciphertext_b64url>" string produced by encryptToken.
 */
export async function decryptToken(encrypted: string): Promise<string> {
  const dot = encrypted.indexOf('.');
  if (dot === -1) throw new Error('Invalid encrypted token format');
  const iv = b64uDecode(encrypted.slice(0, dot));
  const ciphertext = b64uDecode(encrypted.slice(dot + 1));
  const key = await getEncryptionKey();
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}
