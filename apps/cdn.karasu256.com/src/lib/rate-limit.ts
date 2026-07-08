/**
 * Approximates a per-IP request count over a rolling hour using a
 * read-then-write KV counter keyed by the current hour bucket. Cloudflare's
 * native rate limiting binding only supports 10s/60s windows, unsuitable for
 * an hourly quota, so this accepts a small race-condition margin of error in
 * exchange for a simple hourly counter.
 */
export async function checkAndIncrementRateLimit(ip: string, env: Env, limit = 500, windowSeconds = 3600, kvTtlSeconds = 3700): Promise<boolean> {
  const hourBucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `ratelimit:anon:${ip}:${hourBucket}`;
  const current = parseInt((await env.RATE_LIMIT_KV.get(key)) ?? '0', 10);
  if (current >= limit) return false;

  await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: kvTtlSeconds });
  return true;
}
