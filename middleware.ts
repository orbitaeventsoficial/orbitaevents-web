import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, type Locale } from './i18n';

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SECURITY - Credencials des de variables d'entorn
// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTANT: Configura aquestes variables a Vercel Dashboard:
// - ADMIN_USER: nom d'usuari per l'admin
// - ADMIN_PASS: contrasenya segura (mínim 16 caràcters)
// ═══════════════════════════════════════════════════════════════════════════════

// Rate limiting per intents d'autenticació admin (protecció força bruta)
const adminAuthAttempts = new Map<string, { count: number; resetTime: number }>();
const ADMIN_AUTH_LIMIT = 5; // Màxim 5 intents
const ADMIN_AUTH_WINDOW = 15 * 60 * 1000; // 15 minuts

// Netejar entrades expirades cada 5 minuts
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of adminAuthAttempts.entries()) {
      if (entry.resetTime < now) {
        adminAuthAttempts.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkAdminRateLimit(req: NextRequest): boolean {
  const clientIp = getClientIp(req);
  const now = Date.now();
  const entry = adminAuthAttempts.get(clientIp);

  if (!entry || entry.resetTime < now) {
    // No hi ha entrades o ha expirat - permetre
    return true;
  }

  // Bloquejar si supera el límit d'intents fallits
  return entry.count <= ADMIN_AUTH_LIMIT;
}

function recordFailedAttempt(req: NextRequest): void {
  const clientIp = getClientIp(req);
  const now = Date.now();
  const entry = adminAuthAttempts.get(clientIp);

  if (!entry || entry.resetTime < now) {
    adminAuthAttempts.set(clientIp, { count: 1, resetTime: now + ADMIN_AUTH_WINDOW });
  } else {
    entry.count++;
  }
}

function clearFailedAttempts(req: NextRequest): void {
  const clientIp = getClientIp(req);
  adminAuthAttempts.delete(clientIp);
}

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Orbita Admin"',
    },
  });
}

function forbidden() {
  return new NextResponse('Access denied - Invalid credentials', {
    status: 403,
  });
}

function tooManyRequests() {
  return new NextResponse('Too many login attempts. Please try again later.', {
    status: 429,
    headers: {
      'Retry-After': '900', // 15 minuts
    },
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas protegidas del panel admin (UI + API)
  const protectedPaths = [
    '/admin',
    '/api/admin',
  ];

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // Si es ruta protegida, aplicar auth básica amb rate limiting
  if (isProtected) {
    // Rate limiting: bloquejar si massa intents
    if (!checkAdminRateLimit(req)) {
      return tooManyRequests();
    }

    // Obtenir credencials des de variables d'entorn
    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS;

    // Si no hi ha variables configurades, bloquejar accés (sense log d'error)
    if (!ADMIN_USER || !ADMIN_PASS) {
      return forbidden();
    }

    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return unauthorized();
    }

    try {
      const base64Credentials = authHeader.split(' ')[1]!;
      const decoded = atob(base64Credentials);
      const [user, ...passParts] = decoded.split(':');
      const pass = passParts.join(':');

      // Verificar credencials
      if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
        recordFailedAttempt(req);
        return unauthorized();
      }

      // Autenticació correcta - netejar intents fallits
      clearFailedAttempts(req);
    } catch {
      recordFailedAttempt(req);
      return unauthorized();
    }

    return NextResponse.next();
  }

  // Excluir rutas que no necesitan i18n (però /api/admin ja està protegida a dalt)
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Verificar si ya tiene locale en el path
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Si ya tiene locale en URL, usar next-intl normalmente
  if (pathnameHasLocale) {
    const intlMiddleware = createMiddleware({
      locales: [...locales],
      defaultLocale,
      localePrefix: 'as-needed',
    });
    return intlMiddleware(req);
  }

  // Leer cookie NEXT_LOCALE (preferencia manual del usuario)
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value as Locale | undefined;

  // Si hay cookie válida y el usuario quiere español (default), quedarse en la URL sin prefijo
  if (cookieLocale && locales.includes(cookieLocale)) {
    if (cookieLocale === defaultLocale) {
      // Español: no redirigir, servir la página directamente
      const intlMiddleware = createMiddleware({
        locales: [...locales],
        defaultLocale,
        localePrefix: 'as-needed',
        localeDetection: false, // Deshabilitar detección automática
      });
      return intlMiddleware(req);
    } else {
      // Otros idiomas: redirigir a la URL con prefijo
      const url = req.nextUrl.clone();
      url.pathname = `/${cookieLocale}${pathname === '/' ? '' : pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // Sin cookie: usar next-intl con detección automática (Accept-Language)
  const intlMiddleware = createMiddleware({
    locales: [...locales],
    defaultLocale,
    localePrefix: 'as-needed',
  });
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)', '/admin/:path*', '/api/admin/:path*'],
};
