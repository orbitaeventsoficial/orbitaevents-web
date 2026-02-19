// app/api/admin/coverage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'coverage.areas';
type Locale = 'ca' | 'es' | 'en';
const MESSAGES: Record<Locale, Record<string, string>> = {
  ca: {
    parsingAreas: 'Error interpretant àrees de cobertura:',
    gettingAreas: 'Error obtenint àrees de cobertura',
    actionCityRequired: 'Action i city són obligatoris',
    provinceRequired: 'Province és obligatori per afegir',
    cityAlreadyExists: 'Aquesta ciutat ja existeix',
    invalidAction: 'Acció no vàlida',
    updated: 'Àrees de cobertura actualitzades correctament',
    updatingAreas: 'Error actualitzant àrees de cobertura',
    label: 'Àrees de cobertura',
    description: 'Ciutats i províncies on opera Òrbita Events',
  },
  es: {
    parsingAreas: 'Error parseando áreas de cobertura:',
    gettingAreas: 'Error obteniendo áreas de cobertura',
    actionCityRequired: 'Action y city son requeridos',
    provinceRequired: 'Province es requerido para añadir',
    cityAlreadyExists: 'Esta ciudad ya existe',
    invalidAction: 'Acción no válida',
    updated: 'Áreas de cobertura actualizadas correctamente',
    updatingAreas: 'Error actualizando áreas de cobertura',
    label: 'Áreas de Cobertura',
    description: 'Ciudades y provincias donde opera Órbita Events',
  },
  en: {
    parsingAreas: 'Error parsing coverage areas:',
    gettingAreas: 'Error fetching coverage areas',
    actionCityRequired: 'Action and city are required',
    provinceRequired: 'Province is required to add a city',
    cityAlreadyExists: 'This city already exists',
    invalidAction: 'Invalid action',
    updated: 'Coverage areas updated successfully',
    updatingAreas: 'Error updating coverage areas',
    label: 'Coverage Areas',
    description: 'Cities and provinces where Òrbita Events operates',
  },
};

function resolveLocale(req: NextRequest): Locale {
  const lang = req.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

interface CoverageArea {
  city: string;
  province: string;
  enabled: boolean;
}

// GET - Obtener áreas de cobertura
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = MESSAGES[resolveLocale(req)];

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    let areas: CoverageArea[] = [];

    if (setting) {
      try {
        areas = JSON.parse(setting.value);
      } catch (error) {
        log.error(t.parsingAreas, error);
      }
    }

    // Si no hi ha àrees, inicialitzar amb àrees per defecte
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
          label: t.label,
          description: t.description,
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
    log.error(t.gettingAreas + ':', error);
    return NextResponse.json(
      { ok: false, error: t.gettingAreas },
      { status: 500 }
    );
  }
}

// POST - Gestionar áreas de cobertura (add, remove, toggle)
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = MESSAGES[resolveLocale(req)];

  try {
    const body = await req.json();
    const { action, city, province, enabled } = body;

    if (!action || !city) {
      return NextResponse.json(
        { ok: false, error: t.actionCityRequired },
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
        log.error(t.parsingAreas, error);
      }
    }

    // Ejecutar acción
    switch (action) {
      case 'add': {
        if (!province) {
          return NextResponse.json(
            { ok: false, error: t.provinceRequired },
            { status: 400 }
          );
        }

        // Verificar que no existe
        const exists = areas.some((a) => a.city === city);
        if (exists) {
          return NextResponse.json(
            { ok: false, error: t.cityAlreadyExists },
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
          { ok: false, error: t.invalidAction },
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
        label: t.label,
        description: t.description,
      },
      update: {
        value: JSON.stringify(areas),
      },
    });

    // Log del canvi
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
      message: t.updated,
      areas,
    });
  } catch (error) {
    log.error(t.updatingAreas + ':', error);
    return NextResponse.json(
      { ok: false, error: t.updatingAreas },
      { status: 500 }
    );
  }
}
