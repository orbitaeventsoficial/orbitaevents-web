import caMessages from '@/messages/ca.json';
import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';

import type { Locale } from '@/i18n';

const MESSAGES = {
  ca: caMessages,
  es: esMessages,
  en: enMessages,
} as const;

function getByPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

function looksLikeI18nKey(value: string): boolean {
  return value.includes('.') && !value.includes(' ');
}

export function resolveEquipmentCatalogKey(value: string | null | undefined, locale: string): string {
  if (!value) return '';
  if (!looksLikeI18nKey(value)) return value;
  const normalized = (locale === 'ca' || locale === 'es' || locale === 'en' ? locale : 'ca') as Locale;
  const resolved = getByPath(MESSAGES[normalized], value);
  if (typeof resolved === 'string' && resolved.trim()) return resolved;
  const fallback = getByPath(MESSAGES.ca, value);
  return typeof fallback === 'string' && fallback.trim() ? fallback : '';
}
