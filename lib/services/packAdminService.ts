import { prisma } from '@/lib/prisma';
import { translateTextForLocale } from '@/lib/services/translationService';
import { computePackPricingHealth, getPackPricingModelConfig } from '@/lib/services/packPricingHealth';
import { getAllPacks } from '@/config/packs-config';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '@/lib/pack-i18n';
import { log } from '@/lib/logger';
import { SUPPORTED_LOCALES } from '@/lib/constants';

type PackTranslationInput = {
  locale: string;
  name: string;
  description?: string | null;
  tagline?: string | null;
  features?: string[];
};

type CreatePackInput = {
  slug?: string;
  service?: string | null;
  price?: number;
  originalPrice?: number;
  extraHourPrice?: number;
  djHours?: number;
  soundWatts?: number;
  includesFog?: boolean;
  includesMic?: boolean;
  minGuests?: number;
  maxGuests?: number;
  translations?: unknown;
};

type UpdatePackInput = CreatePackInput & {
  isActive?: boolean;
  isFeatured?: boolean;
  order?: number;
  inventory?: unknown;
};

type PackInventoryInput = {
  itemId?: string;
  quantity?: number | string;
  isRequired?: boolean;
};

async function completePackTranslations(input: unknown): Promise<PackTranslationInput[] | undefined> {
  if (!Array.isArray(input) || input.length === 0) return undefined;

  const locales = SUPPORTED_LOCALES;
  const normalized: PackTranslationInput[] = locales.map((locale) => {
    const found = (input as PackTranslationInput[]).find((translation) => translation?.locale === locale);
    return {
      locale,
      name: String(found?.name || '').trim(),
      description: String(found?.description || '').trim(),
      tagline: String(found?.tagline || '').trim(),
      features: Array.isArray(found?.features)
        ? found.features.map((feature) => String(feature).trim()).filter(Boolean)
        : [],
    };
  });

  const source =
    normalized.find((translation) => translation.locale === 'ca' && translation.name) ||
    normalized.find((translation) => translation.name);

  if (!source) return normalized;

  const out = [...normalized];
  for (const locale of locales) {
    if (locale === source.locale) continue;
    const index = out.findIndex((translation) => translation.locale === locale);
    const target = out[index];

    if (!target.name) target.name = await translateTextForLocale(source.name, locale);
    if (!target.description && source.description) {
      target.description = await translateTextForLocale(source.description, locale);
    }
    if (!target.tagline && source.tagline) {
      target.tagline = await translateTextForLocale(source.tagline, locale);
    }
    if ((!target.features || target.features.length === 0) && source.features && source.features.length > 0) {
      target.features = await Promise.all(source.features.map((feature) => translateTextForLocale(feature, locale)));
    }

    out[index] = target;
  }

  return out;
}

export async function listAdminPacks(locale: string, includeInactive: boolean) {
  const packs = await prisma.pack.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: {
      translations: { where: { locale } },
      inventory: { include: { item: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { order: 'asc' },
  });

  const pricingConfig = await getPackPricingModelConfig();
  const packsWithPricing = packs.map((pack) => {
    const health = computePackPricingHealth(pack, pricingConfig);
    return {
      ...pack,
      recommendedOperatorExtraHourPrice: health.recommendedOperatorExtraHourPrice,
      recommendedExtraHourPrice: health.recommendedExtraHourPrice,
    };
  });

  return { ok: true, packs: packsWithPricing };
}

export async function createAdminPack(input: CreatePackInput) {
  const completedTranslations = await completePackTranslations(input.translations);
  const {
    slug,
    service,
    price,
    originalPrice,
    extraHourPrice,
    djHours,
    soundWatts,
    includesFog,
    includesMic,
    minGuests,
    maxGuests,
  } = input;

  if (!slug || !price || !djHours) {
    return { status: 400, body: { error: 'slug, price i djHours són obligatoris' } };
  }

  const pack = await prisma.pack.create({
    data: {
      slug,
      service: service || null,
      price,
      originalPrice,
      extraHourPrice: extraHourPrice || 75,
      djHours,
      soundWatts: soundWatts || 4000,
      includesFog: includesFog ?? true,
      includesMic: includesMic ?? false,
      minGuests,
      maxGuests,
      translations: completedTranslations ? { create: completedTranslations } : undefined,
    },
    include: { translations: true },
  });

  await prisma.adminLog.create({
    data: {
      action: 'CREATE',
      entity: 'pack',
      entityId: pack.id,
      details: { slug, price },
    },
  });

  return { status: 200, body: { ok: true, pack } };
}

export async function getAdminPackById(id: string) {
  const pack = await prisma.pack.findUnique({
    where: { id },
    include: {
      translations: true,
      inventory: {
        include: { item: { select: { code: true, name: true } } },
      },
    },
  });

  if (!pack) {
    return { status: 404, body: { error: 'Pack no trobat' } };
  }

  return { status: 200, body: pack };
}

export async function updateAdminPack(id: string, input: UpdatePackInput) {
  if (input.slug) {
    const existingPack = await prisma.pack.findFirst({
      where: {
        slug: input.slug,
        NOT: { id },
      },
    });

    if (existingPack) {
      return { status: 400, body: { error: 'Aquest slug ja està en ús per un altre pack' } };
    }
  }

  const updateData: Record<string, unknown> = {
    service: input.service,
    price: input.price,
    originalPrice: input.originalPrice,
    extraHourPrice: input.extraHourPrice,
    djHours: input.djHours,
    soundWatts: input.soundWatts,
    includesFog: input.includesFog,
    includesMic: input.includesMic,
    minGuests: input.minGuests,
    maxGuests: input.maxGuests,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    order: input.order,
    updatedAt: new Date(),
  };

  if (input.slug) {
    updateData.slug = input.slug;
  }

  if (input.translations && Array.isArray(input.translations)) {
    const completedTranslations = await completePackTranslations(input.translations);
    updateData.translations = {
      deleteMany: {},
      create: (completedTranslations || []).map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        description: translation.description,
        tagline: translation.tagline,
        features: translation.features || [],
      })),
    };
  }

  if (input.inventory && Array.isArray(input.inventory)) {
    const normalizedInventory = input.inventory
      .map((row: PackInventoryInput) => ({
        itemId: String(row?.itemId || '').trim(),
        quantity: Math.max(1, Number(row?.quantity || 1)),
        isRequired: row?.isRequired !== false,
      }))
      .filter((row: { itemId: string }) => row.itemId);

    updateData.inventory = {
      deleteMany: {},
      create: normalizedInventory.map((row: { itemId: string; quantity: number; isRequired: boolean }) => ({
        itemId: row.itemId,
        quantity: row.quantity,
        isRequired: row.isRequired,
      })),
    };
  }

  const pack = await prisma.pack.update({
    where: { id },
    data: updateData,
    include: { translations: true },
  });

  return { status: 200, body: pack };
}

export async function syncAdminPacksFromConfig() {
  const configPacks = getAllPacks();
  log.info(`Sincronizando ${configPacks.length} packs del config`);

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  const existingPacks = await prisma.pack.findMany({
    where: { slug: { in: configPacks.map((pack) => pack.slug) } },
    select: { id: true, slug: true, isActive: true },
  });
  const existingMap = new Map(existingPacks.map((pack) => [pack.slug, { id: pack.id, isActive: pack.isActive }]));

  await prisma.$transaction(async (tx) => {
    for (const pack of configPacks) {
      try {
        const existing = existingMap.get(pack.slug);
        const packData = {
          code: pack.id,
          service: pack.service,
          price: pack.priceValue,
          originalPrice: pack.priceOriginalValue || null,
          djHours: pack.durationHours || 4,
          isFeatured: pack.popular || false,
          order: configPacks.indexOf(pack),
          minGuests: pack.capacidadMinima ?? null,
          maxGuests: pack.capacidadMaxima ?? null,
        };

        let packId: string;

        if (existing) {
          await tx.pack.update({
            where: { slug: pack.slug },
            data: packData,
          });
          packId = existing.id;
          updated++;
        } else {
          const newPack = await tx.pack.create({
            data: { slug: pack.slug, isActive: true, ...packData },
          });
          packId = newPack.id;
          created++;
        }

        const translationData = ['es', 'ca', 'en'].map((locale) => ({
          packId,
          locale,
          name: resolvePackI18nKey(pack.name, locale),
          tagline: resolvePackI18nKey(pack.tagline || '', locale),
          description: resolvePackI18nKey(pack.emotion || pack.tagline || '', locale),
          features: resolvePackI18nFeatures(pack.features || [], locale),
          badge: resolvePackI18nKey(pack.badge || '', locale),
        }));

        await Promise.all(
          translationData.map((translation) =>
            tx.packTranslation.upsert({
              where: { packId_locale: { packId: translation.packId, locale: translation.locale } },
              create: translation,
              update: {
                name: translation.name,
                tagline: translation.tagline,
                description: translation.description,
                features: translation.features,
                badge: translation.badge,
              },
            })
          )
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        log.error(`Error sincronizando pack ${pack.slug}:`, error);
        errors.push(`${pack.slug}: ${message}`);
      }
    }
  }, { timeout: 20000 });

  log.info(`Sincronització completada: ${created} creats, ${updated} actualitzats`);

  return {
    ok: true,
    message: 'Sincronització completada',
    stats: {
      total: configPacks.length,
      created,
      updated,
      errors: errors.length,
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}
