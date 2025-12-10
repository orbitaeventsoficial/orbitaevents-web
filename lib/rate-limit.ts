/**
 * RATE LIMITING
 * Implementació simple de rate limiting per API routes
 * Nota: En producció amb múltiples instàncies, utilitza Redis
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store en memòria (per instància de servidor)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Netejar entrades expirades cada 5 minuts
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Nombre màxim de requests */
  limit: number;
  /** Finestra de temps en segons */
  windowSeconds: number;
  /** Prefix per identificar el tipus de ruta */
  prefix?: string;
}

/**
 * Obtenir identificador del client (IP)
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
 * @returns null si OK, NextResponse si s'ha excedit el límit
 */
export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const { limit, windowSeconds, prefix = '' } = config;
  const clientId = getClientId(req);
  const key = `${prefix}:${clientId}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // Si no hi ha entrada o ha expirat, crear-ne una nova
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    });
    return null;
  }

  // Incrementar comptador
  entry.count++;

  // Verificar límit
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
 * Configuracions predefinides de rate limit
 */
export const RATE_LIMITS = {
  // Formulari de contacte: 5 requests per 5 minuts
  contact: { limit: 5, windowSeconds: 300, prefix: 'contact' },

  // Sol·licituds de privacitat: 3 per 30 minuts
  privacy: { limit: 3, windowSeconds: 1800, prefix: 'privacy' },

  // Testimonis: 3 per hora
  testimonials: { limit: 3, windowSeconds: 3600, prefix: 'testimonials' },

  // API general: 100 per minut
  api: { limit: 100, windowSeconds: 60, prefix: 'api' },
} as const;
