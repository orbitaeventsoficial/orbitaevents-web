import { getRequestConfig } from 'next-intl/server';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓ D'IDIOMES - ÒRBITA EVENTS
// ═══════════════════════════════════════════════════════════════════════════

// Idiomes disponibles - NOMÉS Català i Espanyol
export const locales = ['ca', 'es'] as const;
export type Locale = (typeof locales)[number];

// Idioma per defecte - Espanyol (SEO i abast nacional)
// Català disponible amb prefix /ca/
export const defaultLocale: Locale = 'es';

// Informació dels idiomes
export const localeConfig: Record<Locale, {
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}> = {
  ca: {
    name: 'Catalan',
    nativeName: 'Català',
    flag: '🏴󠁥󠁳󠁣󠁴󠁿',
    dir: 'ltr'
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dir: 'ltr'
  }
};

// Funció per obtenir la direcció del text
export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return localeConfig[locale]?.dir || 'ltr';
}

// Funció per verificar si és RTL
export function isRTL(locale: Locale): boolean {
  return getLocaleDirection(locale) === 'rtl';
}

// Configuració de next-intl
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Si no hay locale válido, usar el por defecto
  const validLocale = locale && locales.includes(locale as Locale)
    ? locale
    : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});
