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

  // Si es ruta protegida, aplicar auth básica
  if (isProtected) {
    // Obtenir credencials des de variables d'entorn
    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS;

    // Si no hi ha variables configurades, bloquejar accés
    if (!ADMIN_USER || !ADMIN_PASS) {
      console.error('⚠️ ADMIN_USER or ADMIN_PASS not configured in environment variables');
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
        // Log intent fallit (sense revelar credencials)
        console.warn(`⚠️ Failed admin login attempt from IP: ${req.headers.get('x-forwarded-for') || 'unknown'}`);
        return unauthorized();
      }
    } catch {
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
