export const PUBLIC_MOBILE_CHROMELESS_ROUTE_PREFIXES = [
  '/configurador',
  '/contacto',
  '/portal',
  '/reservar',
  '/valoracio',
] as const;

export function isClientPortalRoute(pathWithoutLocale: string) {
  return pathWithoutLocale === '/portal' || pathWithoutLocale.startsWith('/portal/');
}

export function shouldHidePublicMobileChrome(pathWithoutLocale: string, isMobileViewport: boolean) {
  if (!isMobileViewport) return false;

  return PUBLIC_MOBILE_CHROMELESS_ROUTE_PREFIXES.some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}

export function shouldRenderCookieConsent(pathWithoutLocale: string) {
  return !isClientPortalRoute(pathWithoutLocale);
}

export function shouldOffsetMobileCookieConsentForPortalNav(
  pathWithoutLocale: string,
  isMobileViewport: boolean,
) {
  return isMobileViewport && isClientPortalRoute(pathWithoutLocale);
}
