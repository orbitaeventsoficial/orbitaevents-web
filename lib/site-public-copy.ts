import caMessages from '@/messages/ca.json';
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

export type SitePublicLocale = 'ca' | 'es' | 'en';

export type WhatsAppCatalog = {
  general?: string;
  bodas?: string;
  discomovil?: string;
  empresas?: string;
  produccion?: string;
  fiestas?: string;
  alquiler?: string;
  configurador?: string;
};

export type SitePublicCopy = {
  whatsappMessages?: WhatsAppCatalog;
  googleReviews?: {
    fallback?: {
      description?: string;
    };
  };
  contact?: {
    success?: {
      message?: string;
    };
    responseTime?: string;
  };
  siteConfig?: {
    schedule?: {
      weekdays?: string;
      saturday?: string;
      sunday?: string;
      note?: string;
      officeHours?: string;
    };
    stats?: {
      yearsLabel?: string;
      responseTime?: string;
    };
  };
};

const SITE_PUBLIC_COPY_BY_LOCALE: Record<SitePublicLocale, SitePublicCopy> = {
  ca: caMessages as SitePublicCopy,
  es: esMessages as SitePublicCopy,
  en: enMessages as SitePublicCopy,
};

function normalizeLocale(locale?: string): SitePublicLocale {
  return locale === 'es' || locale === 'en' ? locale : 'ca';
}

function getByPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

export function getSitePublicCopy(locale?: string): SitePublicCopy {
  return SITE_PUBLIC_COPY_BY_LOCALE[normalizeLocale(locale)];
}

export function getSiteLocalizedText(path: string, locale?: string): string {
  const normalizedLocale = normalizeLocale(locale);
  const localValue = getByPath(SITE_PUBLIC_COPY_BY_LOCALE[normalizedLocale] as Record<string, unknown>, path);
  if (typeof localValue === 'string' && localValue.trim()) {
    return localValue;
  }

  const fallbackValue = getByPath(SITE_PUBLIC_COPY_BY_LOCALE.ca as Record<string, unknown>, path);
  return typeof fallbackValue === 'string' ? fallbackValue : '';
}
