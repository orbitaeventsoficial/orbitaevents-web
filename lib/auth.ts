/**
 * AUTH UTILITIES
 * Funcions d'autenticació per les API routes d'admin
 */

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export interface AuthResult {
  authenticated: boolean;
  user?: string;
  error?: string;
}

/**
 * Verificar autenticació Basic Auth
 */
export function verifyBasicAuth(req: NextRequest): AuthResult {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { authenticated: false, error: 'No authorization header' };
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    if (!base64Credentials) {
      return { authenticated: false, error: 'Invalid authorization format' };
    }

    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');

    if (!ADMIN_USER || !ADMIN_PASSWORD) {
      // No logging - evitar exposar info de configuració
      return { authenticated: false, error: 'Server configuration error' };
    }

    if (user === ADMIN_USER && pass === ADMIN_PASSWORD) {
      return { authenticated: true, user };
    }

    return { authenticated: false, error: 'Invalid credentials' };
  } catch {
    return { authenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Response per quan no està autenticat
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Orbita Admin API"',
      },
    }
  );
}

/**
 * Helper per verificar auth en API routes
 * Retorna null si autenticat, o NextResponse si no
 */
export function requireAuth(req: NextRequest): NextResponse | null {
  const auth = verifyBasicAuth(req);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }
  return null;
}

/**
 * Obtenir IP del request (per logging)
 */
export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Obtenir User Agent del request (per logging)
 */
export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}
