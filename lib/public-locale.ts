import {
  DEFAULT_PUBLIC_LOCALE,
  PUBLIC_LOCALES,
  type PublicLocale,
} from '@/lib/constants/publicLocale';

export { DEFAULT_PUBLIC_LOCALE, PUBLIC_LOCALES, type PublicLocale };

const PUBLIC_LOCALE_SET = new Set<string>(PUBLIC_LOCALES);

export function normalizePublicLocale(
  value?: string | null,
  fallback: PublicLocale = DEFAULT_PUBLIC_LOCALE
): PublicLocale {
  const safeFallback = PUBLIC_LOCALE_SET.has(fallback) ? fallback : DEFAULT_PUBLIC_LOCALE;
  const raw = String(value || '').trim().toLowerCase();

  for (const locale of PUBLIC_LOCALES) {
    if (raw === locale || raw.startsWith(`${locale}-`) || raw.startsWith(`${locale}_`)) {
      return locale;
    }
  }

  return safeFallback;
}
