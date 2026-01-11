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

    for (const pack of configPacks) {
      try {
        // Buscar si ya existe en la BD
        const existing = await prisma.pack.findUnique({
          where: { slug: pack.slug }
        });

        if (existing) {
          // Actualizar pack existente
          await prisma.pack.update({
            where: { slug: pack.slug },
            data: {
              price: pack.priceValue,
              originalPrice: pack.priceOriginalValue || null,
              djHours: pack.durationHours || 4,
              isActive: true,
              isFeatured: pack.popular || pack.isFlash || false,
              order: configPacks.indexOf(pack),
            }
          });

          // Actualizar/crear traducciones
          for (const locale of ['es', 'ca', 'en']) {
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
                name: pack.name,
                tagline: pack.tagline || '',
                description: pack.emotion || pack.tagline || '',
                features: pack.features || [],
                badge: pack.badge || '',
              },
              update: {
                name: pack.name,
                tagline: pack.tagline || '',
                description: pack.emotion || pack.tagline || '',
                features: pack.features || [],
                badge: pack.badge || '',
              }
            });
          }

          log.info(`Pack actualizado: ${pack.name}`);
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
              isFeatured: pack.popular || pack.isFlash || false,
              order: configPacks.indexOf(pack),
            }
          });

          // Crear traducciones
          for (const locale of ['es', 'ca', 'en']) {
            await prisma.packTranslation.create({
              data: {
                packId: newPack.id,
                locale: locale,
                name: pack.name,
                tagline: pack.tagline || '',
                description: pack.emotion || pack.tagline || '',
                features: pack.features || [],
                badge: pack.badge || '',
              }
            });
          }

          log.info(`Pack creado: ${pack.name}`);
          created++;
        }
      } catch (err: any) {
        log.error(`Error sincronizando pack ${pack.slug}:`, err);
        errors.push(`${pack.slug}: ${err.message}`);
      }
    }

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

  } catch (error: any) {
    log.error('Error en sincronización de packs:', error);
    return NextResponse.json({
      ok: false,
      error: error.message || 'Error sincronizando packs'
    }, { status: 500 });
  }
}
