/**
 * SINCRONIZACIÓN DE PACKS - Config → Base de Datos
 * ==================================================
 * Lee todos los packs de packs-config.ts y los sincroniza con Prisma
 *
 * Uso: npx tsx scripts/sync-packs-to-db.ts
 */

import { PrismaClient } from '@prisma/client';
import { getAllPacks } from '../app/config/packs-config';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '../lib/pack-i18n';

const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function localizedPackFields(pack: any, locale: 'es' | 'ca' | 'en') {
  return {
    name: resolvePackI18nKey(pack.name, locale),
    tagline: resolvePackI18nKey(pack.tagline || '', locale),
    description: resolvePackI18nKey(pack.emotion || pack.tagline || '', locale),
    features: resolvePackI18nFeatures(pack.features || [], locale),
    badge: resolvePackI18nKey(pack.badge || '', locale),
  };
}

async function main() {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  SINCRONIZACIÓN DE PACKS (Config → Base de Datos)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  try {
    // Obtener todos los packs del config
    const configPacks = getAllPacks();
    console.log(`${colors.cyan}📦 Packs en config:${colors.reset} ${configPacks.length}\n`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const pack of configPacks) {
      try {
        // Buscar si ya existe en la BD
        const existing = await prisma.pack.findUnique({
          where: { slug: pack.slug }
        });

        if (existing) {
          // Actualizar pack existente
          // NO tocar isActive — respectar l'estat actual de la BD
          await prisma.pack.update({
            where: { slug: pack.slug },
            data: {
              price: pack.priceValue,
              originalPrice: pack.priceOriginalValue || null,
              djHours: pack.durationHours || 4,
              isFeatured: pack.popular || false,
              order: configPacks.indexOf(pack),
            }
          });

          // Actualizar/crear traducciones
          for (const locale of ['es', 'ca', 'en'] as const) {
            const localized = localizedPackFields(pack, locale);
            await prisma.packTranslation.upsert({
              where: {
                packId_locale: {
                  packId: existing.id,
                  locale: locale
                }
              },
              create: {
                packId: existing.id,
                locale: locale,
                name: localized.name,
                tagline: localized.tagline,
                description: localized.description,
                features: localized.features,
                badge: localized.badge,
              },
              update: {
                name: localized.name,
                tagline: localized.tagline,
                description: localized.description,
                features: localized.features,
                badge: localized.badge,
              }
            });
          }

          console.log(`${colors.green}✓${colors.reset} Actualizado: ${colors.yellow}${pack.name}${colors.reset} (${pack.slug})`);
          updated++;
        } else {
          // Crear nuevo pack
          const newPack = await prisma.pack.create({
            data: {
              slug: pack.slug,
              price: pack.priceValue,
              originalPrice: pack.priceOriginalValue || null,
              djHours: pack.durationHours || 4,
              isActive: true,
              isFeatured: pack.popular || false,
              order: configPacks.indexOf(pack),
            }
          });

          // Crear traducciones
          for (const locale of ['es', 'ca', 'en'] as const) {
            const localized = localizedPackFields(pack, locale);
            await prisma.packTranslation.create({
              data: {
                packId: newPack.id,
                locale: locale,
                name: localized.name,
                tagline: localized.tagline,
                description: localized.description,
                features: localized.features,
                badge: localized.badge,
              }
            });
          }

          console.log(`${colors.green}✓${colors.reset} Creado: ${colors.yellow}${pack.name}${colors.reset} (${pack.slug})`);
          created++;
        }
      } catch (err) {
        console.error(`${colors.red}✗${colors.reset} Error con pack ${pack.slug}:`, err);
        errors++;
      }
    }

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✨ SINCRONIZACIÓN COMPLETADA${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✓ Packs creados:${colors.reset} ${created}`);
    console.log(`${colors.green}✓ Packs actualizados:${colors.reset} ${updated}`);
    if (errors > 0) {
      console.log(`${colors.red}✗ Errores:${colors.reset} ${errors}`);
    }
    console.log();

  } catch (error) {
    console.error(`${colors.red}✗ Error general:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
