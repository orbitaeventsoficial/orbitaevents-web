// lib/packs-db.ts
// Server-side helpers to read packs from the database with safe fallbacks.
import 'server-only';

import { prisma } from '@/lib/prisma';
import { getAllPacks, getPacksByService, type PackDefinition, type ServiceSlug } from '@/config/packs-config';
import { log } from '@/lib/logger';

const fallbackPacks = getAllPacks();

type DbPack = {
  id: string;
  code: string | null;
  slug: string;
  service: string | null;
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
  const badge = translation?.badge || null;

  return {
    id: code,
    service,
    slug: pack.slug,
    name: translation?.name || pack.slug,
    tagline: translation?.tagline || '',
    emotion: translation?.description || translation?.tagline || '',
    price: `${Math.round(pack.price)}€`,
    priceValue: pack.price,
    priceOriginal: pack.originalPrice ? `${Math.round(pack.originalPrice)}€` : null,
    priceOriginalValue: pack.originalPrice ?? null,
    features: translation?.features || [],
    duration: `${durationHours} ${durationLabel}`,
    durationHours,
    popular: pack.isFeatured || false,
    badge,
    capacidadMinima: pack.minGuests ?? undefined,
    capacidadMaxima: pack.maxGuests ?? undefined,
    isFlash: code === 'oferta-flash' || pack.slug.includes('flash'),
  };
}

function getFallback(service?: ServiceSlug): PackDefinition[] {
  return service ? getPacksByService(service) : fallbackPacks;
}

export async function getDbPacks(options: { service?: ServiceSlug; locale?: string } = {}) {
  const { service, locale = 'es' } = options;

  if (!process.env.DATABASE_URL) {
    return getFallback(service);
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
      return getFallback(service);
    }

    return packs.map((pack) => mapPack(pack as DbPack, locale));
  } catch (error) {
    log.error('Error obtenint packs DB:', error);
    return getFallback(service);
  }
}

export async function getDbPackByCode(code: string, locale = 'es') {
  if (!process.env.DATABASE_URL) {
    return fallbackPacks.find((p) => p.id === code || p.slug === code);
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
