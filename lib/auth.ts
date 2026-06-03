/**
 * AUTH UTILITIES
 * Funcions d'autenticació per les API routes d'admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { verifyCsrf } from '@/lib/csrf';

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD;
const ADMIN_KEY = process.env.ADMIN_KEY;

export interface AuthResult {
  authenticated: boolean;
  user?: string;
  error?: string;
  method?: 'basic' | 'bearer' | 'session';
}

export type AdminRole = 'OWNER' | 'MANAGER' | 'VIEWER';
export type AdminPermission =
  | 'read'
  | 'mutate'
  | 'automation'
  | 'integrations';

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  OWNER: ['read', 'mutate', 'automation', 'integrations'],
  MANAGER: ['read', 'mutate', 'automation'],
  VIEWER: ['read'],
};

const SESSION_COOKIE = 'admin-session';

function verifySessionAuth(req: NextRequest): AuthResult {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const secret = ADMIN_PASS;
  if (!token || !secret) {
    return { authenticated: false, error: 'No session cookie' };
  }

  const dot = token.indexOf('.');
  if (dot < 1) {
    return { authenticated: false, error: 'Invalid session format' };
  }

  const expiry = Number(token.slice(0, dot));
  const signature = token.slice(dot + 1);
  if (!Number.isFinite(expiry) || Math.floor(Date.now() / 1000) > expiry) {
    return { authenticated: false, error: 'Session expired' };
  }

  const expected = createHmac('sha256', secret).update(String(expiry)).digest('hex');
  const sigMatch = signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  return sigMatch
    ? { authenticated: true, user: 'admin-session', method: 'session' }
    : { authenticated: false, error: 'Invalid session' };
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
    const [user, ...passParts] = decoded.split(':');
    const pass = passParts.join(':'); // Handle passwords containing ':'

    if (!ADMIN_USER || !ADMIN_PASS) {
      // No logging - evitar exposar info de configuració
      return { authenticated: false, error: 'Server configuration error' };
    }

    const userMatch = user.length === ADMIN_USER.length &&
      timingSafeEqual(Buffer.from(user), Buffer.from(ADMIN_USER));
    const passMatch = pass.length === ADMIN_PASS.length &&
      timingSafeEqual(Buffer.from(pass), Buffer.from(ADMIN_PASS));
    if (userMatch && passMatch) {
      return { authenticated: true, user, method: 'basic' };
    }

    return { authenticated: false, error: 'Invalid credentials' };
  } catch {
    return { authenticated: false, error: 'Authentication failed' };
  }
}

export function verifyBearerAuth(req: NextRequest): AuthResult {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'No bearer token' };
  }

  if (!ADMIN_KEY) {
    return { authenticated: false, error: 'Server configuration error' };
  }

  const token = authHeader.slice(7).trim();
  if (token.length === ADMIN_KEY.length &&
      timingSafeEqual(Buffer.from(token), Buffer.from(ADMIN_KEY))) {
    return { authenticated: true, user: 'admin-key', method: 'bearer' };
  }

  return { authenticated: false, error: 'Invalid token' };
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

export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

export function getAdminRole(req: NextRequest): AdminRole {
  const roleCookie = req.cookies.get('admin_role')?.value?.toUpperCase() as AdminRole | undefined;
  const rawRole = roleCookie || 'OWNER';
  return rawRole in ROLE_PERMISSIONS ? rawRole : 'VIEWER';
}

export function requirePermission(req: NextRequest, permission: AdminPermission): NextResponse | null {
  const role = getAdminRole(req);
  const allowed = ROLE_PERMISSIONS[role].includes(permission);
  if (!allowed) {
    return forbiddenResponse(`Permission denied for role ${role}`);
  }
  return null;
}

/**
 * Helper per verificar auth en API routes
 * Retorna null si autenticat, o NextResponse si no
 */
export function requireAuth(req: NextRequest): NextResponse | null {
  const bearerAuth = verifyBearerAuth(req);
  const sessionAuth = bearerAuth.authenticated ? bearerAuth : verifySessionAuth(req);
  const auth = sessionAuth.authenticated ? sessionAuth : verifyBasicAuth(req);
  if (!auth.authenticated) {
    return unauthorizedResponse(auth.error);
  }

  const method = req.method.toUpperCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (
    isMutation &&
    req.nextUrl.pathname.startsWith('/api/admin') &&
    auth.method !== 'bearer'
  ) {
    const csrfError = verifyCsrf(req);
    if (csrfError) return csrfError;
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
