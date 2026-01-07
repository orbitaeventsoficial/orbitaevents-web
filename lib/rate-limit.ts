/**
 * RATE LIMITING
 * Implementacion simple de rate limiting para API routes.
 * Nota: En produccion con multiples instancias, utiliza Redis.
 */

import { NextRequest, NextResponse } from 'next/server';

const UPSTASH_REDIS_REST_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
const USE_UPSTASH = Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store en memoria (por instancia de servidor)
const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Numero maximo de requests */
  limit: number;
  /** Ventana de tiempo en segundos */
  windowSeconds: number;
  /** Prefix para identificar el tipo de ruta */
  prefix?: string;
}

/**
 * Obtener identificador del client (IP)
 */
function getClientId(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Verificar rate limit
 * @returns null si OK, NextResponse si se excede el limite
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const { limit, windowSeconds, prefix = '' } = config;
  const clientId = getClientId(req);
  const key = `${prefix}:${clientId}`;
  const now = Date.now();

  if (USE_UPSTASH) {
    try {
      const script =
        "local v=redis.call('INCR', KEYS[1]); if v==1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; local ttl=redis.call('TTL', KEYS[1]); return {v, ttl};";
      const res = await fetch(`${UPSTASH_REDIS_REST_URL}/eval`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([script, 1, key, windowSeconds]),
      });

      if (!res.ok) {
        throw new Error(`Upstash error ${res.status}`);
      }

      const data = (await res.json()) as { result?: [number, number] };
      const count = data.result?.[0] ?? 1;
      const ttl = data.result?.[1] ?? windowSeconds;

      if (count > limit) {
        const retryAfter = Math.max(1, ttl);
        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests. Please try again later.',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': (Date.now() + retryAfter * 1000).toString(),
            },
          }
        );
      }

      return null;
    } catch {
      // Fall through to in-memory limiter when Upstash fails.
    }
  }

  cleanupExpiredEntries(now);

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });
    return null;
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Configuraciones predefinidas de rate limit
 */
export const RATE_LIMITS = {
  contact: { limit: 5, windowSeconds: 300, prefix: 'contact' },
  privacy: { limit: 3, windowSeconds: 1800, prefix: 'privacy' },
  testimonials: { limit: 3, windowSeconds: 3600, prefix: 'testimonials' },
  uploads: { limit: 10, windowSeconds: 3600, prefix: 'uploads' },
  api: { limit: 100, windowSeconds: 60, prefix: 'api' },
} as const;