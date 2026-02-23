import { NextResponse, type NextRequest } from 'next/server';
import { checkAdminRateLimit, recordFailedAttempt } from './admin-rate-limit';

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

/**
 * Validates admin auth (Basic or Bearer) and CSRF for mutations.
 * Returns a NextResponse if the request should be blocked, null if it should proceed.
 */
export async function handleAdminAuth(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS = process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD;

  if (!ADMIN_USER || !ADMIN_PASS) return forbidden();

  const authHeader = req.headers.get('authorization');
  const adminKey = process.env.ADMIN_KEY;
  const isBearerAuth =
    Boolean(adminKey) &&
    Boolean(authHeader?.startsWith('Bearer ')) &&
    authHeader?.slice(7).trim() === adminKey;

  if (!isBearerAuth && (!authHeader || !authHeader.startsWith('Basic '))) {
    return unauthorized();
  }

  let authValid = isBearerAuth;

  if (!isBearerAuth) {
    try {
      const base64Credentials = authHeader!.split(' ')[1]!;
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
  }

  if (!authValid) {
    const isAllowed = await checkAdminRateLimit(req);
    if (!isAllowed) return tooManyRequests();
    await recordFailedAttempt(req);
    return unauthorized();
  }

  // CSRF check for API mutations (not needed for Bearer auth)
  if (pathname.startsWith('/api/admin')) {
    const method = req.method.toUpperCase();
    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (isMutation && !isBearerAuth) {
      const csrfHeader = req.headers.get('x-csrf-token');
      const csrfCookie = req.cookies.get('csrf-token')?.value;
      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        return NextResponse.json({ error: 'CSRF token missing or invalid' }, { status: 403 });
      }
    }
  }

  return null; // Auth passed, proceed
}
