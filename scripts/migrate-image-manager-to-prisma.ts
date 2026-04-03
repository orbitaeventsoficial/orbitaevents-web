/**
 * Migració one-time: Setting(JSON) → ImageAsset
 *
 * Llegeix el blob JSON antic de la taula Setting (key: config.imageManagerPlacements)
 * i crea registres ImageAsset individuals per cada placement amb assets.
 *
 * Executar: npx tsx scripts/migrate-image-manager-to-prisma.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SETTING_KEY = 'config.imageManagerPlacements';

type LegacyAsset = {
  id?: string;
  src?: string;
  alt?: string;
  path?: string;
  label?: string;
  mimeType?: string;
  sortOrder?: number;
  updatedAt?: string;
};

type LegacyEntry = {
  mode?: string;
  asset?: LegacyAsset;
  items?: LegacyAsset[];
};

async function main() {
  console.log('Llegint Setting antiga...');

  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) {
    console.log('No existeix la Setting. Res a migrar.');
    return;
  }

  let store: Record<string, LegacyEntry>;
  try {
    store = JSON.parse(setting.value);
  } catch {
    console.error('Error parsejant JSON de la Setting.');
    return;
  }

  const rowsToCreate = Object.entries(store).flatMap(([key, entry]) => {
    if (!entry || entry.mode !== 'manual') return [];

    const items = entry.items?.length
      ? entry.items
      : entry.asset?.src
        ? [entry.asset]
        : [];

    return items.flatMap((item, index) => {
      if (!item?.src) return [];
      return [{
        placement: key,
        src: item.src,
        filePath: item.path || null,
        alt: item.alt || null,
        label: item.label || null,
        mimeType: item.mimeType || null,
        sortOrder: item.sortOrder ?? index,
      }];
    });
  });

  const created = await prisma.$transaction(async (tx) => {
    const currentSetting = await tx.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!currentSetting) {
      throw new Error('La Setting ha desaparegut durant la migració.');
    }

    const existingCount = await tx.imageAsset.count();
    if (existingCount > 0) {
      throw new Error(`Ja hi ha ${existingCount} ImageAsset registres. Migració ja feta o parcial.`);
    }

    if (rowsToCreate.length > 0) {
      await tx.imageAsset.createMany({ data: rowsToCreate });
    }

    await tx.setting.delete({ where: { key: SETTING_KEY } });
    return rowsToCreate.length;
  });

  console.log(`${created} ImageAsset registres creats.`);
  console.log('Setting antiga eliminada.');
  console.log('Migració completada.');
}

main()
  .catch((err) => {
    console.error('Error en la migració:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
