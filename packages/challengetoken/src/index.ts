export function generateChallengeToken(): string {
  return crypto.randomUUID();
}

/**
 * Prepends a magic marker + token to `payload`, so the CDN can later verify
 * the caller went through the challenge round-trip before storing the file.
 */
export function embedChallengeToken(payload: Uint8Array, token: string, magic = 'CTKN1', tokenLength = 36): Uint8Array {
  if (token.length !== tokenLength) throw new Error('Invalid challenge token length');
  const header = new TextEncoder().encode(magic + token);
  const result = new Uint8Array(header.length + payload.length);
  result.set(header, 0);
  result.set(payload, header.length);
  return result;
}

export interface ExtractedChallenge {
  token: string;
  payload: Uint8Array;
}

/**
 * Reads the token embedded by {@link embedChallengeToken} back out, returning
 * null when the header is missing or doesn't match. Uses `.slice()` rather
 * than `.subarray()` so the returned payload owns its own correctly-bounded
 * `ArrayBuffer`, not a view into the original (still-header-prefixed) buffer.
 */
export function extractChallengeToken(buffer: Uint8Array, magic = 'CTKN1', tokenLength = 36): ExtractedChallenge | null {
  const headerLength = magic.length + tokenLength;
  if (buffer.length < headerLength) return null;

  const decoder = new TextDecoder();
  if (decoder.decode(buffer.slice(0, magic.length)) !== magic) return null;

  const token = decoder.decode(buffer.slice(magic.length, headerLength));
  return { token, payload: buffer.slice(headerLength) };
}
