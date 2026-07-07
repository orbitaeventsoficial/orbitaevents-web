export const PUBLIC_MOBILE_CHROMELESS_ROUTE_PREFIXES = [
  '/configurador',
  '/contacto',
  '/reservar',
  '/valoracio',
] as const;

export function shouldHidePublicMobileChrome(pathWithoutLocale: string, isMobileViewport: boolean) {
  if (!isMobileViewport) return false;

  return PUBLIC_MOBILE_CHROMELESS_ROUTE_PREFIXES.some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );
}
