import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, type Locale } from './i18n';
import { handleAdminAuth } from './lib/middleware/admin-auth';

// Pre-compiled regex for bot detection
const BLOCKED_BOTS_RE = /AhrefsBot|SemrushBot|DotBot|MJ12bot|BLEXBot|DataForSeoBot|serpstatbot|Bytespider|PetalBot|YandexBot|MegaIndex|Sogou|Baiduspider/;

const LEGACY_REDIRECTS: Record<string, string> = {
  '/contacte': '/ca/contacto',
  '/sobre-nosaltres': '/ca/about',
};

const PROTECTED_PATHS = ['/admin', '/api/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const normalizedPath =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // 1. Block abusive bots (cheapest check first)
  if (BLOCKED_BOTS_RE.test(req.headers.get('user-agent') || '')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 2. Strip www subdomain
  if (req.headers.get('host') === 'www.orbitaevents.com') {
    const url = req.nextUrl.clone();
    url.hostname = 'orbitaevents.com';
    url.port = '';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  // 3. Legacy redirects (permanent 301)
  const redirectTarget = LEGACY_REDIRECTS[normalizedPath];
  if (redirectTarget) {
    const url = req.nextUrl.clone();
    url.pathname = redirectTarget;
    return NextResponse.redirect(url, 301);
  }

  // 4. Admin auth (UI + API)
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (isProtected) {
    const authResponse = await handleAdminAuth(req);
    return authResponse ?? NextResponse.next();
  }

  // 5. Skip i18n for non-page routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 6. i18n routing
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return createMiddleware({ locales: [...locales], defaultLocale, localePrefix: 'as-needed' })(req);
  }

  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value as Locale | undefined;

  if (cookieLocale && locales.includes(cookieLocale)) {
    if (cookieLocale === defaultLocale) {
      return createMiddleware({
        locales: [...locales],
        defaultLocale,
        localePrefix: 'as-needed',
        localeDetection: false,
      })(req);
    }
    const url = req.nextUrl.clone();
    url.pathname = `/${cookieLocale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  return createMiddleware({ locales: [...locales], defaultLocale, localePrefix: 'as-needed' })(req);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/admin/:path*', '/api/admin/:path*'],
};
