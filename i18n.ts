import { getRequestConfig } from 'next-intl/server';
import { log } from '@/lib/logger';
import { prisma } from '@/app/lib/prisma';

// CONFIGURACION DE IDIOMAS - ORBITA EVENTS

// Idiomas disponibles
export const locales = ['ca', 'es', 'en'] as const;
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
    nativeName: 'Català',
    flag: 'CA',
    dir: 'ltr'
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    flag: 'ES',
    dir: 'ltr'
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: 'GB',
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

  const baseMessages = (await import(`./messages/${validLocale}.json`)).default;
  const messages = await mergeDbTranslations(baseMessages, validLocale);

  return {
    locale: validLocale,
    messages
  };
});

function setValueByPath(
  obj: Record<string, unknown>,
  path: string,
  value: string
): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextArray = /^\d+$/.test(nextKey);

    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = isNextArray ? [] : {};
    }

    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

async function mergeDbTranslations(
  baseMessages: Record<string, unknown>,
  locale: Locale
): Promise<Record<string, unknown>> {
  const messages = JSON.parse(JSON.stringify(baseMessages)) as Record<string, unknown>;

  try {
    const rows = await prisma.translation.findMany({
      where: { locale },
      select: { namespace: true, key: true, value: true },
    });

    for (const row of rows) {
      const path = row.key ? `${row.namespace}.${row.key}` : row.namespace;
      if (!path) continue;
      setValueByPath(messages, path, row.value);
    }
  } catch (error) {
    log.error('Error carregant traduccions desde DB', error);
  }

  return messages;
}
