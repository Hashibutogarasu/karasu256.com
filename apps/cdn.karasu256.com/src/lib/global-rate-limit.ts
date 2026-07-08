interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requests = new Map<string, RateLimitEntry>();

/**
 * Approximates a per-IP request count using an in-memory counter scoped to
 * the current isolate. Cloudflare Workers may run multiple isolates
 * concurrently across PoPs (and recycle them over time), so this is not a
 * strictly global limit across the edge network — it's a cheap first line
 * of defense on top of the KV-backed limiter already used for anonymous
 * uploads.
 */
export function checkGlobalRateLimit(ip: string, limit = 30, windowMs = 60_000): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}
