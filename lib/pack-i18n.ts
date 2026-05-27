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

/**
 * Detecta si un valor sembla una clau i18n (conté punts i no espais).
 * "configurator.step2.packs.bodas-basico.name" → true
 * "DJ professional 3 hores" → false
 */
function looksLikeI18nKey(value: string): boolean {
  return value.includes('.') && !value.includes(' ');
}

/**
 * Genera totes les variants possibles d'una clau i18n per buscar-la.
 */
function normalizeCandidateKeys(value: string): string[] {
  const candidates = new Set<string>();
  const raw = value.trim();
  if (!raw) return [];

  candidates.add(raw);

  const noConfigurator = raw.startsWith('configurator.') ? raw.slice('configurator.'.length) : raw;
  candidates.add(noConfigurator);
  candidates.add(`configurator.${noConfigurator}`);

  // pages.mobile.X ↔ services.mobile.X (bidireccional)
  if (noConfigurator.startsWith('pages.mobile.')) {
    const modern = noConfigurator.replace('pages.mobile.', 'services.mobile.');
    candidates.add(modern);
    candidates.add(`configurator.${modern}`);
  }
  if (noConfigurator.startsWith('services.mobile.')) {
    const legacy = noConfigurator.replace('services.mobile.', 'pages.mobile.');
    candidates.add(legacy);
    candidates.add(`configurator.${legacy}`);
  }

  // features.fN → features.N-1 (índex basat en 0)
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

  // features.N → features.fN+1
  const numericMatch = noConfigurator.match(/^(.*)\.features\.(\d+)$/);
  if (numericMatch) {
    const base = numericMatch[1];
    const idx = Number.parseInt(numericMatch[2], 10);
    candidates.add(`${base}.features.f${idx + 1}`);
    candidates.add(`configurator.${base}.features.f${idx + 1}`);
  }

  return Array.from(candidates);
}

/**
 * Resol una clau i18n a text real.
 * Si el valor no és una clau (conté espais), el retorna directament.
 * MAI retorna una clau en brut — si no es pot resoldre, retorna cadena buida.
 */
export function resolvePackI18nKey(value: string | null | undefined, locale: string): string {
  if (!value) return '';

  // Si el text ja és llegible (conté espais), retornar-lo directament
  if (!looksLikeI18nKey(value)) return value;

  const normalized = (locale === 'ca' || locale === 'en' || locale === 'es' ? locale : 'ca') as Locale;

  for (const candidate of normalizeCandidateKeys(value)) {
    const resolved = getByPath(MESSAGES[normalized], candidate);
    if (typeof resolved === 'string' && resolved.trim()) {
      return resolved;
    }
  }

  // Fallback a català si estem en un altre idioma
  if (normalized !== 'ca') {
    for (const candidate of normalizeCandidateKeys(value)) {
      const resolved = getByPath(MESSAGES.ca, candidate);
      if (typeof resolved === 'string' && resolved.trim()) {
        return resolved;
      }
    }
  }

  // MAI retornar una clau en brut — retornar cadena buida
  return '';
}

/**
 * Resol un array de features. Filtra les que no es puguin resoldre.
 */
export function resolvePackI18nFeatures(values: string[] | null | undefined, locale: string): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => resolvePackI18nKey(value, locale))
    .filter((text) => text.length > 0);
}
