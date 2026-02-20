/**
 * API: Sincronizar Packs del Config a la Base de Datos
 * ====================================================
 * POST /api/admin/packs/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getAllPacks } from '@/config/packs-config';
import { log } from '@/lib/logger';
import { resolvePackI18nFeatures, resolvePackI18nKey } from '@/lib/pack-i18n';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Verificar autenticación admin
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    // Obtener todos los packs del config
    const configPacks = getAllPacks();
    log.info(`Sincronizando ${configPacks.length} packs del config`);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // Obtener todos los packs existentes en una sola query
    const existingPacks = await prisma.pack.findMany({
      where: { slug: { in: configPacks.map(p => p.slug) } },
      select: { id: true, slug: true },
    });
    const existingMap = new Map(existingPacks.map(p => [p.slug, p.id]));

    // Usar transacción para batch de operaciones
    await prisma.$transaction(async (tx) => {
      for (const pack of configPacks) {
        try {
          const existingId = existingMap.get(pack.slug);
          const packData = {
            code: pack.id,
            service: pack.service,
            price: pack.priceValue,
            originalPrice: pack.priceOriginalValue || null,
            djHours: pack.durationHours || 4,
            isActive: true,
            isFeatured: pack.popular || pack.isFlash || false,
            order: configPacks.indexOf(pack),
            minGuests: pack.capacidadMinima ?? null,
            maxGuests: pack.capacidadMaxima ?? null,
          };

          let packId: string;

          if (existingId) {
            await tx.pack.update({
              where: { slug: pack.slug },
              data: packData,
            });
            packId = existingId;
            updated++;
          } else {
            const newPack = await tx.pack.create({
              data: { slug: pack.slug, ...packData },
            });
            packId = newPack.id;
            created++;
          }

          // Batch upsert de traducciones
          const translationData = ['es', 'ca', 'en'].map(locale => ({
            packId,
            locale,
            name: resolvePackI18nKey(pack.name, locale),
            tagline: resolvePackI18nKey(pack.tagline || '', locale),
            description: resolvePackI18nKey(pack.emotion || pack.tagline || '', locale),
            features: resolvePackI18nFeatures(pack.features || [], locale),
            badge: resolvePackI18nKey(pack.badge || '', locale),
          }));

          await Promise.all(
            translationData.map(t =>
              tx.packTranslation.upsert({
                where: { packId_locale: { packId: t.packId, locale: t.locale } },
                create: t,
                update: {
                  name: t.name,
                  tagline: t.tagline,
                  description: t.description,
                  features: t.features,
                  badge: t.badge,
                },
              })
            )
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          log.error(`Error sincronizando pack ${pack.slug}:`, err);
          errors.push(`${pack.slug}: ${message}`);
        }
      }
    }, { timeout: 20000 });

    log.info(`Sincronización completada: ${created} creados, ${updated} actualizados`);

    return NextResponse.json({
      ok: true,
      message: 'Sincronización completada',
      stats: {
        total: configPacks.length,
        created,
        updated,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error sincronizando packs';
    log.error('Error en sincronización de packs:', error);
    return NextResponse.json({
      ok: false,
      error: message
    }, { status: 500 });
  }
}
