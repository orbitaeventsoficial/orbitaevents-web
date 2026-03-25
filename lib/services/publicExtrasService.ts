import { EXTRAS, type ExtraDefinition } from '@/config/packs-config';
import { PUBLIC_EXTRA_REGISTRY_BY_SLUG, type PublicExtraSupportedLocale } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

type SupportedLocale = PublicExtraSupportedLocale;

function normalizeLocale(locale: string): SupportedLocale {
  return locale === 'es' || locale === 'en' ? locale : 'ca';
}

function isTranslationKey(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^(configurator|pages|services|extras)\./.test(value);
}

function resolveRegistryEntry(extraId: string) {
  return PUBLIC_EXTRA_REGISTRY_BY_SLUG[extraId] ?? null;
}

function resolveConfigFallback(extraId: string): ExtraDefinition | undefined {
  const registryEntry = resolveRegistryEntry(extraId);
  if (!registryEntry) {
    return EXTRAS.find((entry) => entry.id === extraId);
  }

  return (
    EXTRAS.find((entry) => entry.id === registryEntry.canonicalId) ??
    EXTRAS.find((entry) => registryEntry.meta.aliases?.includes(entry.id))
  );
}

export function resolvePublicExtraDefinition(extra: {
  slug: string;
  price: number;
  priceType: string;
  translationName?: string | null;
  translationDescription?: string | null;
}, locale: SupportedLocale): ExtraDefinition {
  const registryEntry = resolveRegistryEntry(extra.slug);
  const configFallback = resolveConfigFallback(extra.slug);
  const registryTranslation = registryEntry?.meta.translations[locale];

  const resolvedName =
    !isTranslationKey(extra.translationName) && extra.translationName
      ? extra.translationName
      : registryTranslation?.name || configFallback?.name || extra.slug;

  const resolvedDescription =
    !isTranslationKey(extra.translationDescription) && extra.translationDescription
      ? extra.translationDescription
      : registryTranslation?.description || configFallback?.description || '';

  return {
    id: extra.slug,
    name: resolvedName,
    description: resolvedDescription,
    price: extra.priceType === 'ON_REQUEST' ? null : extra.price,
    consultarPrecio: extra.priceType === 'ON_REQUEST',
    icon: registryEntry?.meta.icon || configFallback?.icon || '🎵',
    category: registryEntry?.meta.category || configFallback?.category,
    compatibleWith: registryEntry?.meta.compatibleWith || configFallback?.compatibleWith,
    popular: registryEntry?.meta.popular ?? configFallback?.popular,
    premium: registryEntry?.meta.premium ?? configFallback?.premium,
  };
}

export async function listPublicExtras(locale: string) {
  const normalizedLocale = normalizeLocale(locale);
  const dbExtras = await prisma.extra.findMany({
    where: { isActive: true },
    include: {
      translations: {
        where: { locale: normalizedLocale },
      },
    },
    orderBy: { order: 'asc' },
  });

  if (dbExtras.length === 0) {
    const extras: ExtraDefinition[] = EXTRAS.filter(e => e.enabled !== false).map((extra) =>
      resolvePublicExtraDefinition(
        {
          slug: extra.id,
          price: typeof extra.price === 'number' ? extra.price : 0,
          priceType: extra.consultarPrecio ? 'ON_REQUEST' : 'FIXED',
          translationName: extra.name,
          translationDescription: extra.description,
        },
        normalizedLocale
      )
    );

    return {
      extras,
      source: 'config' as const,
    };
  }

  // If all config extras are disabled, hide all extras (admin toggle)
  const allConfigDisabled = EXTRAS.length > 0 && EXTRAS.every(e => e.enabled === false);
  if (allConfigDisabled) {
    return { extras: [], source: 'database' as const };
  }

  const extras: ExtraDefinition[] = dbExtras.map((extra) => {
      const translation = extra.translations[0];
      return resolvePublicExtraDefinition(
        {
          slug: extra.slug,
          price: extra.price,
          priceType: extra.priceType,
          translationName: translation?.name,
          translationDescription: translation?.description,
        },
        normalizedLocale
      );
    });

  return {
    extras,
    source: 'database' as const,
  };
}
