import { getRequestConfig } from 'next-intl/server';

// CONFIGURACION DE IDIOMAS - ORBITA EVENTS

// Idiomas disponibles
export const locales = ['ca', 'es'] as const;
export type Locale = (typeof locales)[number];

// Idioma por defecto
export const defaultLocale: Locale = 'es';

// Informacion de idiomas
export const localeConfig: Record<Locale, {
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}> = {
  ca: {
    name: 'Catalan',
    nativeName: 'Catala',
    flag: 'CA',
    dir: 'ltr'
  },
  es: {
    name: 'Spanish',
    nativeName: 'Espanol',
    flag: 'ES',
    dir: 'ltr'
  }
};

// Funcion para obtener la direccion del texto
export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return localeConfig[locale]?.dir || 'ltr';
}

// Funcion para verificar si es RTL
export function isRTL(locale: Locale): boolean {
  return getLocaleDirection(locale) === 'rtl';
}

// Configuracion de next-intl
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Si no hay locale valido, usar el por defecto
  const validLocale = locale && locales.includes(locale as Locale)
    ? locale
    : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});