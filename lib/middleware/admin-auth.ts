import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminRateLimit, recordFailedAttempt } from './admin-rate-limit';

const SESSION_COOKIE = 'admin-session';
const SESSION_TTL_S = 30 * 24 * 3600; // 30 dies

export function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Orbita Admin"' },
  });
}

export function forbidden() {
  return new NextResponse('Access denied - Invalid credentials', { status: 403 });
}

export function tooManyRequests() {
  return new NextResponse('Too many login attempts. Please try again later.', {
    status: 429,
    headers: { 'Retry-After': '900' },
  });
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function makeSessionToken(secret: string): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
  const sig = await hmacHex(secret, String(expiry));
  return `${expiry}.${sig}`;
}

async function verifySessionToken(secret: string, token: string): Promise<boolean> {
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expiry = Number(token.slice(0, dot));
  if (!Number.isFinite(expiry) || Math.floor(Date.now() / 1000) > expiry) return false;
  const expected = await hmacHex(secret, String(expiry));
  return token.slice(dot + 1) === expected;
}

function setSessionCookie(res: NextResponse, token: string, isSecure: boolean) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: SESSION_TTL_S,
    path: '/',
  });
}

/**
 * Validates admin auth (Basic, Bearer o cookie de sessió persistent).
 * Returns a NextResponse if the request should be blocked, null if it should proceed.
 */
export async function handleAdminAuth(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD;

  if (!ADMIN_USER || !ADMIN_PASS) return forbidden();

  const isSecure = req.nextUrl.protocol === 'https:';

  // ── 1. Cookie de sessió persistent (evita demanar clau cada cop) ──────────
  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (sessionCookie && (await verifySessionToken(ADMIN_PASS, sessionCookie))) {
    // CSRF check for mutations (cookie path)
    if (pathname.startsWith('/api/admin')) {
      const method = req.method.toUpperCase();
      const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
      if (isMutation) {
        const csrfHeader = req.headers.get('x-csrf-token');
        const csrfCookie = req.cookies.get('csrf-token')?.value;
        if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
          return NextResponse.json({ error: 'CSRF token missing or invalid' }, { status: 403 });
        }
      }
    }
    return null; // sessió vàlida, continua
  }

  // ── 2. Bearer token (crons / E2E) ─────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY;
  const isBearerAuth =
    Boolean(adminKey) &&
    Boolean(authHeader?.startsWith('Bearer ')) &&
    authHeader?.slice(7).trim() === adminKey;

  if (isBearerAuth) return null;

  // ── 3. Basic Auth → si correcte, emet cookie de sessió ───────────────────
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorized();
  }

  let authValid = false;
  try {
    const base64Credentials = authHeader.split(' ')[1]!;
    const decoded =
      typeof atob === 'function'
        ? atob(base64Credentials)
        : Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [user, ...passParts] = decoded.split(':');
    const pass = passParts.join(':');
    authValid = user === ADMIN_USER && pass === ADMIN_PASS;
  } catch {
    authValid = false;
  }

  if (!authValid) {
    const isAllowed = await checkAdminRateLimit(req);
    if (!isAllowed) return tooManyRequests();
    await recordFailedAttempt(req);
    return unauthorized();
  }

  // CSRF check for API mutations (Basic auth path)
  if (pathname.startsWith('/api/admin')) {
    const method = req.method.toUpperCase();
    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (isMutation) {
      const csrfHeader = req.headers.get('x-csrf-token');
      const csrfCookie = req.cookies.get('csrf-token')?.value;
      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        return NextResponse.json({ error: 'CSRF token missing or invalid' }, { status: 403 });
      }
    }
  }

  // Credencials correctes → emet cookie de sessió de 30 dies
  const token = await makeSessionToken(ADMIN_PASS);
  const res = NextResponse.next();
  setSessionCookie(res, token, isSecure);
  return res;
}
