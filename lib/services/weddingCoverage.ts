import type { Messages } from 'next-intl';

const COVERAGE_ZONE_DEFINITIONS = [
  {
    href: '/servicios/dj-bodas-maresme',
    icon: '🏖️',
    nameKey: 'coverage.zones.maresme.name',
    descKey: 'coverage.zones.maresme.desc',
    fallbackName: 'Maresme',
    fallbackDesc: 'Bodas frente al mar y fincas costeras',
  },
  {
    href: '/servicios/dj-bodas-girona',
    icon: '🏛️',
    nameKey: 'coverage.zones.girona.name',
    descKey: 'coverage.zones.girona.desc',
    fallbackName: 'Girona',
    fallbackDesc: 'Masías, castillos y eventos elegantes',
  },
  {
    href: '/servicios/dj-bodas-costa-brava',
    icon: '🌊',
    nameKey: 'coverage.zones.costaBrava.name',
    descKey: 'coverage.zones.costaBrava.desc',
    fallbackName: 'Costa Brava',
    fallbackDesc: 'Celebraciones junto al mar con montaje completo',
  },
  {
    href: '/servicios/dj-bodas-valles',
    icon: '🏡',
    nameKey: 'coverage.zones.valles.name',
    descKey: 'coverage.zones.valles.desc',
    fallbackName: 'Vallès',
    fallbackDesc: 'Bodas en jardines, masías y espacios privados',
  },
];

function isI18nKey(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^(configurator|pages|services|extras)\./.test(value);
}

function humanizeKeyFallback(value: string): string {
  const parts = value.split('.');
  const last = parts[parts.length - 1] || value;
  const prev = parts.length > 1 ? parts[parts.length - 2] : '';

  if (/^f\d+$/i.test(last)) {
    return `Característica ${last.slice(1)}`;
  }

  const semantic = new Set(['name', 'tagline', 'ideal', 'description', 'title']);
  const token = semantic.has(last) && prev ? prev : last;
  return token
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function getMessageByPath(messages: Messages | undefined, path: string): string | null {
  if (!messages) return null;
  const value = path.split('.').reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== 'object') return null;
    const record = acc as Record<string, unknown>;
    return part in record ? record[part] : null;
  }, messages);

  return typeof value === 'string' ? value : null;
}

function resolveCoverageText(
  messages: Messages | undefined,
  t: (key: string) => string,
  key: string,
  fallback: string,
) {
  try {
    const translated = t(key);
    if (translated !== key) return translated;
  } catch {
    // continue to fallback
  }

  const nested = getMessageByPath(messages, key);
  if (nested && !isI18nKey(nested)) return nested;
  if (nested && isI18nKey(nested)) return humanizeKeyFallback(nested);
  return fallback;
}

export function getWeddingCoverageZones(messages: Messages | undefined, t: (key: string) => string) {
  return COVERAGE_ZONE_DEFINITIONS.map((zone) => ({
    href: zone.href,
    icon: zone.icon,
    name: resolveCoverageText(messages, t, zone.nameKey, zone.fallbackName),
    desc: resolveCoverageText(messages, t, zone.descKey, zone.fallbackDesc),
  }));
}


