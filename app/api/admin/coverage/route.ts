// app/api/admin/coverage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'coverage.areas';

interface CoverageArea {
  city: string;
  province: string;
  enabled: boolean;
}

// GET - Obtener áreas de cobertura
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let areas: CoverageArea[] = [];

    if (setting) {
      try {
        areas = JSON.parse(setting.value);
      } catch (error) {
        log.error('Error parseando áreas de cobertura:', error);
      }
    }

    // Si no hay áreas, inicializar con áreas por defecto
    if (areas.length === 0) {
      areas = [
        { city: 'Barcelona', province: 'Barcelona', enabled: true },
        { city: 'Hospitalet de Llobregat', province: 'Barcelona', enabled: true },
        { city: 'Badalona', province: 'Barcelona', enabled: true },
        { city: 'Sabadell', province: 'Barcelona', enabled: true },
        { city: 'Terrassa', province: 'Barcelona', enabled: true },
        { city: 'Girona', province: 'Girona', enabled: true },
        { city: 'Tarragona', province: 'Tarragona', enabled: true },
        { city: 'Lleida', province: 'Lleida', enabled: true },
      ];

      // Guardar en BD
      await prisma.setting.upsert({
        where: { key: SETTING_KEY },
        create: {
          key: SETTING_KEY,
          value: JSON.stringify(areas),
          type: 'JSON',
          category: 'config',
          label: 'Áreas de Cobertura',
          description: 'Ciudades y provincias donde opera Órbita Events',
        },
        update: {
          value: JSON.stringify(areas),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      areas,
    });
  } catch (error) {
    log.error('Error obteniendo áreas de cobertura:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obteniendo áreas de cobertura' },
      { status: 500 }
    );
  }
}

// POST - Gestionar áreas de cobertura (add, remove, toggle)
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { action, city, province, enabled } = body;

    if (!action || !city) {
      return NextResponse.json(
        { ok: false, error: 'Action y city son requeridos' },
        { status: 400 }
      );
    }

    // Obtener áreas actuales
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let areas: CoverageArea[] = [];
    if (setting) {
      try {
        areas = JSON.parse(setting.value);
      } catch (error) {
        log.error('Error parseando áreas:', error);
      }
    }

    // Ejecutar acción
    switch (action) {
      case 'add': {
        if (!province) {
          return NextResponse.json(
            { ok: false, error: 'Province es requerido para añadir' },
            { status: 400 }
          );
        }

        // Verificar que no existe
        const exists = areas.some((a) => a.city === city);
        if (exists) {
          return NextResponse.json(
            { ok: false, error: 'Esta ciudad ya existe' },
            { status: 400 }
          );
        }

        areas.push({
          city,
          province,
          enabled: true,
        });
        break;
      }

      case 'remove': {
        areas = areas.filter((a) => a.city !== city);
        break;
      }

      case 'toggle': {
        const area = areas.find((a) => a.city === city);
        if (area) {
          area.enabled = enabled;
        }
        break;
      }

      default:
        return NextResponse.json(
          { ok: false, error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Guardar cambios
    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(areas),
        type: 'JSON',
        category: 'config',
        label: 'Áreas de Cobertura',
        description: 'Ciudades y provincias donde opera Órbita Events',
      },
      update: {
        value: JSON.stringify(areas),
      },
    });

    // Log del cambio
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'coverage',
        entityId: SETTING_KEY,
        details: { action, city, province, enabled },
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Áreas de cobertura actualizadas correctamente',
      areas,
    });
  } catch (error) {
    log.error('Error actualizando áreas de cobertura:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualizando áreas de cobertura' },
      { status: 500 }
    );
  }
}
