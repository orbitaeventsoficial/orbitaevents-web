import { EXTRAS, type ExtraDefinition, type ServiceSlug } from '@/config/packs-config';
import { prisma } from '@/lib/prisma';

type SupportedLocale = 'ca' | 'es' | 'en';

type ExtraMeta = Pick<ExtraDefinition, 'icon' | 'category' | 'compatibleWith' | 'popular' | 'premium'> & {
  aliases?: string[];
  translations: Record<SupportedLocale, { name: string; description: string }>;
};

const DEFAULT_COMPATIBILITY: ServiceSlug[] = ['bodas', 'discomovil', 'fiestas', 'empresas'];

const EXTRA_REGISTRY: Record<string, ExtraMeta> = {
  'extra-hour': {
    aliases: ['hora-extra'],
    icon: '⏰',
    category: 'time',
    compatibleWith: DEFAULT_COMPATIBILITY,
    popular: true,
    translations: {
      ca: { name: 'Hora extra DJ', description: 'Allarga la festa una hora més' },
      es: { name: 'Hora extra DJ', description: 'Extiende la fiesta una hora más' },
      en: { name: 'Extra DJ hour', description: 'Extend the party one more hour' },
    },
  },
  'low-fog': {
    aliases: ['humo-bajo'],
    icon: '☁️',
    category: 'effects',
    compatibleWith: DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Fum baix', description: 'Efecte de boira arran de terra' },
      es: { name: 'Fum baix', description: 'Efecto de niebla a ras de suelo' },
      en: { name: 'Low fog', description: 'Ground-level fog effect' },
    },
  },
  'co2-cannon': {
    aliases: ['co2-gun'],
    icon: '💨',
    category: 'effects',
    compatibleWith: DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Canó CO2', description: 'Explosions de fum fred espectaculars' },
      es: { name: 'Cañón CO2', description: 'Explosiones de humo frío espectaculares' },
      en: { name: 'CO2 Cannon', description: 'Spectacular cold smoke explosions' },
    },
  },
  confetti: {
    aliases: ['confetti'],
    icon: '🎉',
    category: 'effects',
    compatibleWith: DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Canó de confeti', description: 'Explosió de color per a moments clau' },
      es: { name: 'Cañón de confeti', description: 'Explosión de color para momentos clave' },
      en: { name: 'Confetti cannon', description: 'Explosion of color for key moments' },
    },
  },
  sparklers: {
    aliases: ['fuego-frio'],
    icon: '✨',
    category: 'effects',
    compatibleWith: DEFAULT_COMPATIBILITY,
    premium: true,
    translations: {
      ca: { name: 'Bengales fredes', description: 'Espurnes fredes per entrades i moments WOW' },
      es: { name: 'Bengalas frías', description: 'Chispas frías para entradas y momentos WOW' },
      en: { name: 'Cold sparklers', description: 'Cold sparks for entrances and WOW moments' },
    },
  },
  'extra-lights': {
    aliases: ['caps-mobils-extra'],
    icon: '💡',
    category: 'lighting',
    compatibleWith: DEFAULT_COMPATIBILITY,
    popular: true,
    translations: {
      ca: { name: 'Llums extra', description: 'Més caps mòbils per més impacte' },
      es: { name: 'Luces extra', description: 'Más cabezas móviles para más impacto' },
      en: { name: 'Extra lights', description: 'More moving heads for more impact' },
    },
  },
  karaoke: {
    icon: '🎤',
    category: 'sound',
    compatibleWith: DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Karaoke', description: 'Sistema de karaoke amb milers de cançons' },
      es: { name: 'Karaoke', description: 'Sistema de karaoke con miles de canciones' },
      en: { name: 'Karaoke', description: 'Karaoke system with thousands of songs' },
    },
  },
  'theme-hp': {
    icon: '🪄',
    category: 'visual',
    compatibleWith: DEFAULT_COMPATIBILITY,
    premium: true,
    translations: {
      ca: { name: 'Tematització Món Màgic', description: 'Decoració màgica completa d\'escola de bruixeria' },
      es: { name: 'Tematización Mundo Mágico', description: 'Decoración mágica completa de escuela de brujos' },
      en: { name: 'Magic World theme', description: 'Complete magical wizard school decoration' },
    },
  },
  'theme-halloween': {
    icon: '🎃',
    category: 'visual',
    compatibleWith: DEFAULT_COMPATIBILITY,
    premium: true,
    translations: {
      ca: { name: 'Tematització Halloween', description: 'Terror i diversió per la teva festa' },
      es: { name: 'Tematización Halloween', description: 'Terror y diversión para tu fiesta' },
      en: { name: 'Halloween theme', description: 'Terror and fun for your party' },
    },
  },
  'gopro-recording': {
    icon: '📹',
    category: 'visual',
    compatibleWith: DEFAULT_COMPATIBILITY,
    translations: {
      ca: { name: 'Gravació GoPro', description: 'Capturem els millors moments' },
      es: { name: 'Grabación GoPro', description: 'Capturamos los mejores momentos' },
      en: { name: 'GoPro recording', description: 'We capture the best moments' },
    },
  },
};

const EXTRA_REGISTRY_BY_SLUG = buildRegistryBySlug();

function buildRegistryBySlug(): Record<string, { canonicalId: string; meta: ExtraMeta }> {
  const entries = Object.entries(EXTRA_REGISTRY).flatMap(([canonicalId, meta]) => {
    const slugs = [canonicalId, ...(meta.aliases ?? [])];
    return slugs.map((slug) => [slug, { canonicalId, meta }] as const);
  });
  return Object.fromEntries(entries);
}

function normalizeLocale(locale: string): SupportedLocale {
  return locale === 'es' || locale === 'en' ? locale : 'ca';
}

function isTranslationKey(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^(configurator|pages|services|extras)\./.test(value);
}

function resolveRegistryEntry(extraId: string) {
  return EXTRA_REGISTRY_BY_SLUG[extraId] ?? null;
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
    const extras: ExtraDefinition[] = EXTRAS.map((extra) =>
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
