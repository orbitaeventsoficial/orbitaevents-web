// lib/packs-db.ts
// Server-side helpers to read packs from the database with safe fallbacks.
import 'server-only';

import { prisma } from '@/lib/prisma';
import { getAllPacks, getPacksByService, type PackDefinition, type ServiceSlug } from '@/config/packs-config';
import { log } from '@/lib/logger';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '@/lib/pack-i18n';
import { isBuildPrerenderPhase } from '@/lib/build-phase';

const fallbackPacks = getAllPacks();

type DbPack = {
  id: string;
  code?: string | null;
  slug: string;
  service?: string | null;
  price: number;
  originalPrice: number | null;
  djHours: number;
  extraHourPrice?: number | null;
  minGuests: number | null;
  maxGuests: number | null;
  isFeatured: boolean;
  translations: {
    locale: string;
    name: string;
    tagline: string | null;
    description: string | null;
    features: string[];
    badge: string | null;
  }[];
};

/**
 * Detecta si un valor és una clau i18n (punts sense espais) i per tant no és text real.
 */
function looksLikeI18nKey(value: string): boolean {
  return value.includes('.') && !value.includes(' ');
}

/**
 * Retorna el text real, preferint el valor directe si no és una clau i18n.
 * Si és una clau, intenta resoldre-la; si falla, usa el fallback del config estàtic.
 */
function resolveOrFallback(dbValue: string | null | undefined, configFallback: string | undefined, locale: string): string {
  // Si la BD té text real (no una clau), usar-lo directament
  if (dbValue && !looksLikeI18nKey(dbValue)) return dbValue;

  // Si la BD té una clau i18n, intentar resoldre-la
  if (dbValue) {
    const resolved = resolvePackI18nKey(dbValue, locale);
    if (resolved) return resolved;
  }

  // Fallback: text directe del config estàtic (ja és text real, no claus)
  if (configFallback && !looksLikeI18nKey(configFallback)) return configFallback;
  if (configFallback) {
    const resolved = resolvePackI18nKey(configFallback, locale);
    if (resolved) return resolved;
  }

  return '';
}

function mapPack(pack: DbPack, locale: string): PackDefinition {
  const translation =
    pack.translations.find((t) => t.locale === locale) ||
    pack.translations[0];

  const durationHours = pack.djHours || 4;
  const durationLabel = locale === 'ca' ? 'hores' : locale === 'en' ? 'hours' : 'horas';
  const fallbackPack = fallbackPacks.find((p) => p.slug === pack.slug);
  const code = pack.code || fallbackPack?.id || pack.slug;
  const service = (pack.service || fallbackPack?.service || 'fiestas') as ServiceSlug;

  const name = resolveOrFallback(translation?.name, fallbackPack?.name, locale);
  const tagline = resolveOrFallback(translation?.tagline, fallbackPack?.tagline, locale);
  const emotion = resolveOrFallback(
    translation?.description || translation?.tagline,
    fallbackPack?.emotion || fallbackPack?.tagline,
    locale,
  );

  // Features: si la BD té claus i18n, preferir les del config estàtic
  const dbFeatures = translation?.features?.length ? translation.features : [];
  const configFeatures = fallbackPack?.features || [];
  let features: string[];

  if (dbFeatures.length > 0 && dbFeatures.some((f) => !looksLikeI18nKey(f))) {
    // BD té text real → usar-lo
    features = dbFeatures.filter((f) => !looksLikeI18nKey(f) || resolvePackI18nKey(f, locale));
    features = features.map((f) => looksLikeI18nKey(f) ? (resolvePackI18nKey(f, locale) || f) : f).filter(Boolean);
  } else if (configFeatures.length > 0) {
    // Fallback a config estàtic (text directe en català)
    features = resolvePackI18nFeatures(configFeatures, locale);
    if (features.length === 0) features = configFeatures.filter((f) => !looksLikeI18nKey(f));
  } else {
    features = resolvePackI18nFeatures(dbFeatures, locale);
  }

  const rawBadge = translation?.badge || fallbackPack?.badge || null;
  const badge = rawBadge ? resolveOrFallback(rawBadge, fallbackPack?.badge || undefined, locale) : null;

  return {
    id: code,
    service,
    slug: pack.slug,
    i18nBaseKey: fallbackPack?.i18nBaseKey,
    name: name || pack.slug,
    tagline,
    emotion,
    price: `${Math.round(pack.price)}€`,
    priceValue: pack.price,
    priceOriginal: pack.originalPrice ? `${Math.round(pack.originalPrice)}€` : null,
    priceOriginalValue: pack.originalPrice ?? null,
    features,
    duration: `${durationHours} ${durationLabel}`,
    durationHours,
    extraHourPrice: Number((pack as { extraHourPrice?: number | null }).extraHourPrice ?? 0) || undefined,
    popular: pack.isFeatured || false,
    badge: badge || null,
    capacidadMinima: pack.minGuests ?? undefined,
    capacidadMaxima: pack.maxGuests ?? undefined,
    isFlash: code === 'oferta-flash' || pack.slug.includes('flash'),
  };
}

function localizeFallbackPack(pack: PackDefinition, locale: string): PackDefinition {
  return {
    ...pack,
    name: resolvePackI18nKey(pack.name, locale),
    tagline: resolvePackI18nKey(pack.tagline, locale),
    emotion: resolvePackI18nKey(pack.emotion || pack.tagline || '', locale),
    features: resolvePackI18nFeatures(pack.features || [], locale),
    badge: pack.badge ? resolvePackI18nKey(pack.badge, locale) : null,
    ideal: resolvePackI18nKey(pack.ideal || '', locale),
  };
}

function getFallback(service: ServiceSlug | undefined, locale: string): PackDefinition[] {
  const source = service ? getPacksByService(service) : fallbackPacks;
  return source.map((pack) => localizeFallbackPack(pack, locale));
}

export async function getDbPacks(options: { service?: ServiceSlug; locale?: string } = {}) {
  const { service, locale = 'es' } = options;

  if (!process.env.DATABASE_URL || isBuildPrerenderPhase()) {
    return getFallback(service, locale);
  }

  try {
    const packs = await prisma.pack.findMany({
      where: {
        isActive: true,
        ...(service ? { service } : {}),
      },
      orderBy: { order: 'asc' },
      include: { translations: true },
    });

    if (!packs.length) {
      return getFallback(service, locale);
    }

    return packs.map((pack) => mapPack(pack as DbPack, locale));
  } catch (error) {
    log.error('Error obtenint packs DB:', error);
    return getFallback(service, locale);
  }
}

export async function getDbPackByCode(code: string, locale = 'es') {
  if (!process.env.DATABASE_URL || isBuildPrerenderPhase()) {
    const fallback = fallbackPacks.find((p) => p.id === code || p.slug === code);
    return fallback ? localizeFallbackPack(fallback, locale) : undefined;
  }

  try {
    const pack = await prisma.pack.findFirst({
      where: {
        OR: [{ code }, { slug: code }],
      },
      include: { translations: true },
    });

    if (!pack) return null;
    return mapPack(pack as DbPack, locale);
  } catch (error) {
    log.error('Error obtenint pack DB:', error);
    return null;
  }
}
