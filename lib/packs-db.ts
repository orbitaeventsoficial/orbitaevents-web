// lib/packs-db.ts
// Server-side helpers to read packs from the database with safe fallbacks.
import 'server-only';

import { prisma } from '@/lib/prisma';
import { getAllPacks, getPacksByService, type PackDefinition, type ServiceSlug } from '@/config/packs-config';
import { log } from '@/lib/logger';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '@/lib/pack-i18n';

const fallbackPacks = getAllPacks();

type DbPack = {
  id: string;
  code?: string | null;
  slug: string;
  service?: string | null;
  price: number;
  originalPrice: number | null;
  djHours: number;
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

function mapPack(pack: DbPack, locale: string): PackDefinition {
  const translation =
    pack.translations.find((t) => t.locale === locale) ||
    pack.translations[0];

  const durationHours = pack.djHours || 4;
  const durationLabel = locale === 'ca' ? 'hores' : locale === 'en' ? 'hours' : 'horas';
  const fallbackPack = fallbackPacks.find((p) => p.slug === pack.slug);
  const code = pack.code || fallbackPack?.id || pack.slug;
  const service = (pack.service || fallbackPack?.service || 'fiestas') as ServiceSlug;
  const rawName = translation?.name || fallbackPack?.name || pack.slug;
  const rawTagline = translation?.tagline || fallbackPack?.tagline || '';
  const rawEmotion = translation?.description || translation?.tagline || fallbackPack?.emotion || '';
  const rawFeatures = (translation?.features?.length ? translation.features : fallbackPack?.features) || [];
  const rawBadge = translation?.badge || fallbackPack?.badge || null;

  return {
    id: code,
    service,
    slug: pack.slug,
    i18nBaseKey: fallbackPack?.i18nBaseKey,
    name: resolvePackI18nKey(rawName, locale),
    tagline: resolvePackI18nKey(rawTagline, locale),
    emotion: resolvePackI18nKey(rawEmotion, locale),
    price: `${Math.round(pack.price)}€`,
    priceValue: pack.price,
    priceOriginal: pack.originalPrice ? `${Math.round(pack.originalPrice)}€` : null,
    priceOriginalValue: pack.originalPrice ?? null,
    features: resolvePackI18nFeatures(rawFeatures, locale),
    duration: `${durationHours} ${durationLabel}`,
    durationHours,
    popular: pack.isFeatured || false,
    badge: rawBadge ? resolvePackI18nKey(rawBadge, locale) : null,
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

  if (!process.env.DATABASE_URL) {
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
  if (!process.env.DATABASE_URL) {
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
