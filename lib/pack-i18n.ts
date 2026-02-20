import caMessages from '@/messages/ca.json';
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

type Locale = 'ca' | 'es' | 'en';

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  ca: caMessages as Record<string, unknown>,
  es: esMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
};

function getByPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

export function resolvePackI18nKey(value: string | null | undefined, locale: string): string {
  if (!value) return '';
  if (!value.includes('.')) return value;
  const normalized = (locale === 'ca' || locale === 'en' || locale === 'es' ? locale : 'ca') as Locale;
  const resolved = getByPath(MESSAGES[normalized], value);
  return typeof resolved === 'string' ? resolved : value;
}

export function resolvePackI18nFeatures(values: string[] | null | undefined, locale: string): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => resolvePackI18nKey(value, locale));
}

