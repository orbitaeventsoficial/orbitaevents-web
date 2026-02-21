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

function normalizeCandidateKeys(value: string): string[] {
  const candidates = new Set<string>();
  const raw = value.trim();
  if (!raw) return [];

  candidates.add(raw);

  const noConfigurator = raw.startsWith('configurator.') ? raw.slice('configurator.'.length) : raw;
  candidates.add(noConfigurator);
  candidates.add(`configurator.${noConfigurator}`);

  if (noConfigurator.startsWith('pages.parties.discoPacks.')) {
    const modern = noConfigurator.replace('pages.parties.discoPacks.', 'services.mobile.discoPacks.');
    candidates.add(modern);
    candidates.add(`configurator.${modern}`);
  }

  if (noConfigurator.includes('.features.f')) {
    const match = noConfigurator.match(/^(.*)\.features\.f(\d+)$/);
    if (match) {
      const base = match[1];
      const numeric = Number.parseInt(match[2], 10);
      if (Number.isFinite(numeric) && numeric > 0) {
        candidates.add(`${base}.features.${numeric - 1}`);
        candidates.add(`configurator.${base}.features.${numeric - 1}`);
      }
    }
  }

  return Array.from(candidates);
}

function humanizeKey(value: string): string {
  const parts = value.split('.');
  const last = parts[parts.length - 1] || value;
  const prev = parts.length > 1 ? parts[parts.length - 2] : '';

  if (/^f\d+$/i.test(last)) {
    const n = last.slice(1);
    return `Característica ${n}`;
  }

  const semantic = new Set(['name', 'tagline', 'ideal', 'description', 'title']);
  const token = semantic.has(last) && prev ? prev : last;

  return token
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function resolvePackI18nKey(value: string | null | undefined, locale: string): string {
  if (!value) return '';
  if (!value.includes('.')) return value;
  const normalized = (locale === 'ca' || locale === 'en' || locale === 'es' ? locale : 'ca') as Locale;
  for (const candidate of normalizeCandidateKeys(value)) {
    const resolved = getByPath(MESSAGES[normalized], candidate);
    if (typeof resolved === 'string' && resolved.trim()) {
      return resolved;
    }
  }
  return humanizeKey(value);
}

export function resolvePackI18nFeatures(values: string[] | null | undefined, locale: string): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => resolvePackI18nKey(value, locale));
}
