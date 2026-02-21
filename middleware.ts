import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, type Locale } from './i18n';

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SECURITY - Credencials des de variables d'entorn
// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTANT: Configura aquestes variables al panell de Railway:
// - ADMIN_USER: nom d'usuari per l'admin
// - ADMIN_PASS o ADMIN_PASSWORD: contrasenya segura (mínim 16 caràcters)
// ═══════════════════════════════════════════════════════════════════════════════

// Rate limiting per intents d'autenticació admin (protecció força bruta)
// Uses Upstash Redis for distributed rate limiting in serverless environments
const ADMIN_AUTH_LIMIT = 5; // Màxim 5 intents
const ADMIN_AUTH_WINDOW_SECONDS = 900; // 15 minuts

const UPSTASH_REDIS_REST_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
const USE_UPSTASH = Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

// Fallback in-memory store (only for development/when Redis not available)
const adminAuthAttempts = new Map<string, { count: number; resetTime: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

async function checkAdminRateLimit(req: NextRequest): Promise<boolean> {
  const clientIp = getClientIp(req);
  const key = `admin-auth:${clientIp}`;

  // Try Upstash Redis first
  if (USE_UPSTASH) {
    try {
      const res = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
      });

      if (res.ok) {
        const data = (await res.json()) as { result: number | null };
        const count = data.result || 0;
        return count <= ADMIN_AUTH_LIMIT;
      }
    } catch {
      // Fall through to in-memory
    }
  }

  // Fallback to in-memory (development only)
  const now = Date.now();

  // Cleanup expired entries
  for (const [k, entry] of adminAuthAttempts.entries()) {
    if (entry.resetTime < now) {
      adminAuthAttempts.delete(k);
    }
  }

  const entry = adminAuthAttempts.get(clientIp);
  if (!entry || entry.resetTime < now) {
    return true;
  }

  return entry.count <= ADMIN_AUTH_LIMIT;
}

async function recordFailedAttempt(req: NextRequest): Promise<void> {
  const clientIp = getClientIp(req);
  const key = `admin-auth:${clientIp}`;

  // Try Upstash Redis first
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

  // Fallback to in-memory
  const now = Date.now();
  const entry = adminAuthAttempts.get(clientIp);

  if (!entry || entry.resetTime < now) {
    adminAuthAttempts.set(clientIp, {
      count: 1,
      resetTime: now + ADMIN_AUTH_WINDOW_SECONDS * 1000
    });
  } else {
    entry.count++;
  }
}

async function clearFailedAttempts(req: NextRequest): Promise<void> {
  const clientIp = getClientIp(req);
  const key = `admin-auth:${clientIp}`;

  // Try Upstash Redis first
  if (USE_UPSTASH) {
    try {
      await fetch(`${UPSTASH_REDIS_REST_URL}/del/${key}`, {
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
      });
      return;
    } catch {
      // Fall through to in-memory
    }
  }

  // Fallback to in-memory
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

// ═══════════════════════════════════════════════════════════════════════════════
// BOT BLOCKING - Bloqueja bots abusius per reduir requests
// ═══════════════════════════════════════════════════════════════════════════════
const BLOCKED_BOTS = [
  'AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot', 'BLEXBot',
  'DataForSeoBot', 'serpstatbot', 'Bytespider', 'PetalBot',
  'YandexBot', 'MegaIndex', 'Sogou', 'Baiduspider',
];

function isBlockedBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BLOCKED_BOTS.some(bot => userAgent.includes(bot));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host');
  const userAgent = req.headers.get('user-agent');
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  const legacyRedirects: Record<string, string> = {
    '/contacte': '/ca/contacto',
  };

  const redirectTarget = legacyRedirects[normalizedPath];
  if (redirectTarget) {
    const url = req.nextUrl.clone();
    url.pathname = redirectTarget;
    return NextResponse.redirect(url, 301);
  }

  // 🚫 Bloquejar bots abusius immediatament
  if (isBlockedBot(userAgent)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (host === 'www.orbitaevents.com') {
    const url = req.nextUrl.clone();
    url.hostname = 'orbitaevents.com';
    return NextResponse.redirect(url, 301);
  }

  // Legacy Catalan slug: redirect to current about page
  if (pathname === '/sobre-nosaltres') {
    const url = req.nextUrl.clone();
    url.pathname = '/ca/about';
    return NextResponse.redirect(url, 301);
  }

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
    const isAllowed = await checkAdminRateLimit(req);
    if (!isAllowed) {
      return tooManyRequests();
    }

    // Obtenir credencials des de variables d'entorn
    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS || process.env.ADMIN_PASSWORD;

    // Si no hi ha variables configurades, bloquejar accés (sense log d'error)
    if (!ADMIN_USER || !ADMIN_PASS) {
      return forbidden();
    }

    const authHeader = req.headers.get('authorization');
    const adminKey = process.env.ADMIN_KEY;
    const isBearerAuth =
      Boolean(adminKey) &&
      Boolean(authHeader?.startsWith('Bearer ')) &&
      authHeader?.slice(7).trim() === adminKey;

    if (!isBearerAuth && (!authHeader || !authHeader.startsWith('Basic '))) {
      return unauthorized();
    }

    try {
      if (!isBearerAuth) {
        const base64Credentials = authHeader!.split(' ')[1]!;
        const decoded =
          typeof atob === 'function'
            ? atob(base64Credentials)
            : Buffer.from(base64Credentials, 'base64').toString('utf8');
        const [user, ...passParts] = decoded.split(':');
        const pass = passParts.join(':');

        // Verificar credencials
        if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
          await recordFailedAttempt(req);
          return unauthorized();
        }
      }

      // Autenticació correcta - netejar intents fallits
      await clearFailedAttempts(req);
    } catch {
      await recordFailedAttempt(req);
      return unauthorized();
    }

    if (pathname.startsWith('/api/admin')) {
      const method = req.method.toUpperCase();
      const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

      if (isMutation && !isBearerAuth) {
        const csrfHeader = req.headers.get('x-csrf-token');
        const csrfCookie = req.cookies.get('csrf-token')?.value;

        if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
          return NextResponse.json(
            { error: 'CSRF token missing or invalid' },
            { status: 403 }
          );
        }
      }
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

  // Si hay cookie válida y el usuario quiere el idioma por defecto (es), quedarse en la URL sin prefijo
  if (cookieLocale && locales.includes(cookieLocale)) {
    if (cookieLocale === defaultLocale) {
      // Idioma por defecto (es): no redirigir, servir la página directamente
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
  matcher: ['/((?!_next|.*\\..*).*)', '/admin/:path*', '/api/admin/:path*'],
};
