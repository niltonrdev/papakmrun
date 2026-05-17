const store = globalThis.__papakmRateLimitStore || new Map();
if (!globalThis.__papakmRateLimitStore) {
  globalThis.__papakmRateLimitStore = store;
}

function getIp(request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * In-memory rate limit (best effort, per instance).
 */
export function checkRateLimit(request, bucket, limit, windowMs) {
  const now = Date.now();
  const ip = getIp(request);
  const key = `${bucket}:${ip}`;
  const row = store.get(key);
  if (!row || row.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (row.count >= limit) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((row.resetAt - now) / 1000) };
  }
  row.count += 1;
  return { ok: true, remaining: Math.max(0, limit - row.count) };
}

