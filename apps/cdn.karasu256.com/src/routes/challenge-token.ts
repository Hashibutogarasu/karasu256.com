import { Elysia } from 'elysia';
import { checkAndIncrementRateLimit } from '../lib/rate-limit';
import { generateChallengeToken } from '@Hashibutogarasu/challengetoken';

async function issueChallengeToken(env: Env, ttlSeconds = 120): Promise<string> {
  const token = generateChallengeToken();
  await env.RATE_LIMIT_KV.put(`challenge:${token}`, '1', { expirationTtl: ttlSeconds });
  return token;
}

/**
 * Issues a short-lived, single-use challenge token that callers must embed
 * into the file they upload next (see `consumeChallengeToken`), proving they
 * round-tripped through this Worker instead of hitting the upload endpoints
 * directly with an arbitrary file. Reuses the anonymous-upload's per-IP
 * hourly rate limit so token issuance can't be used to bypass it.
 */
export const challengeTokenRoute = (env: Env) =>
  new Elysia().post('/challenge-token', async ({ request, set }) => {
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) {
      set.status = 400;
      return { error: 'Bad Request' };
    }

    const allowed = await checkAndIncrementRateLimit(ip, env);
    if (!allowed) {
      set.status = 429;
      set.headers['Retry-After'] = '3600';
      return { error: 'Rate limit exceeded' };
    }

    const token = await issueChallengeToken(env);
    return { token };
  });
