import { type NextRequest } from 'next/server';

const ADMIN_AUTH_LIMIT = 5;
const ADMIN_AUTH_WINDOW_SECONDS = 900; // 15 minuts

const UPSTASH_REDIS_REST_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
const USE_UPSTASH = Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

// Fallback in-memory (development / quan Redis no està disponible)
const adminAuthAttempts = new Map<string, { count: number; resetTime: number }>();

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function checkAdminRateLimit(req: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_ADMIN_RATE_LIMIT === '1') {
    return true;
  }
  const clientIp = getClientIp(req);
  const key = `admin-auth:${clientIp}`;

  if (USE_UPSTASH) {
    try {
      const res = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { result: number | null };
        return (data.result || 0) < ADMIN_AUTH_LIMIT;
      }
    } catch {
      // Fall through to in-memory
    }
  }

  const now = Date.now();
  for (const [k, entry] of adminAuthAttempts.entries()) {
    if (entry.resetTime < now) adminAuthAttempts.delete(k);
  }
  const entry = adminAuthAttempts.get(clientIp);
  if (!entry || entry.resetTime < now) return true;
  return entry.count < ADMIN_AUTH_LIMIT;
}

export async function recordFailedAttempt(req: NextRequest): Promise<void> {
  const clientIp = getClientIp(req);
  const key = `admin-auth:${clientIp}`;

  if (USE_UPSTASH) {
    try {
      const script =
        "local v=redis.call('INCR', KEYS[1]); if v==1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return v;";
      await fetch(`${UPSTASH_REDIS_REST_URL}/eval`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([script, 1, key, ADMIN_AUTH_WINDOW_SECONDS]),
      });
      return;
    } catch {
      // Fall through to in-memory
    }
  }

  const now = Date.now();
  const entry = adminAuthAttempts.get(clientIp);
  if (!entry || entry.resetTime < now) {
    adminAuthAttempts.set(clientIp, { count: 1, resetTime: now + ADMIN_AUTH_WINDOW_SECONDS * 1000 });
  } else {
    entry.count++;
  }
}
