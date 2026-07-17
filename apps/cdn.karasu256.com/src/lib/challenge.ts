import { extractChallengeToken } from '@Hashibutogarasu/challengetoken';

/**
 * Verifies and consumes (single-use) a challenge token embedded in `buffer`
 * by {@link import('@Hashibutogarasu/challengetoken').embedChallengeToken}.
 * Returns the original payload (header stripped) on success, or null when
 * the header is missing/malformed or the token was never issued (or was
 * already consumed/expired).
 */
export async function consumeChallengeToken(buffer: Uint8Array, env: Env): Promise<Uint8Array | null> {
  const extracted = extractChallengeToken(buffer);
  if (!extracted) return null;

  const key = `challenge:${extracted.token}`;
  const exists = await env.RATE_LIMIT_KV.get(key);
  if (!exists) return null;

  await env.RATE_LIMIT_KV.delete(key);
  return extracted.payload;
}
