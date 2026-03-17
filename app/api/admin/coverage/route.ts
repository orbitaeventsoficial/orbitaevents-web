import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import {
  ensureCoverageAreasSetting,
  updateCoverageAreas,
} from '@/lib/coverage';

export const dynamic = 'force-dynamic';

type Locale = 'ca' | 'es' | 'en';
const MESSAGES: Record<Locale, Record<string, string>> = {
  ca: {
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
    gettingAreas: 'Error obteniendo áreas de cobertura',
    actionCityRequired: 'Action y city son requeridos',
    provinceRequired: 'Province es requerido para añadir',
    cityAlreadyExists: 'Esta ciudad ya existe',
    invalidAction: 'Acción no válida',
    updated: 'Áreas de cobertura actualizadas correctamente',
    updatingAreas: 'Error actualizando áreas de cobertura',
    label: 'Áreas de Cobertura',
    description: 'Ciudades y provincias donde opera Òrbita Events',
  },
  en: {
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

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = MESSAGES[resolveLocale(req)];

  try {
    const areas = await ensureCoverageAreasSetting({ label: t.label, description: t.description });
    return NextResponse.json({ ok: true, areas });
  } catch (error) {
    log.error(t.gettingAreas + ':', error);
    return NextResponse.json({ ok: false, error: t.gettingAreas }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = MESSAGES[resolveLocale(req)];

  try {
    const body = await req.json();
    const { action, city, province, enabled } = body;

    if (!action || !city) {
      return NextResponse.json({ ok: false, error: t.actionCityRequired }, { status: 400 });
    }
    if (action === 'add' && !province) {
      return NextResponse.json({ ok: false, error: t.provinceRequired }, { status: 400 });
    }

    const result = await updateCoverageAreas({
      action,
      city,
      province,
      enabled,
      label: t.label,
      description: t.description,
    });

    if (result.status === 400 && result.body.error === 'city_exists') {
      return NextResponse.json({ ok: false, error: t.cityAlreadyExists }, { status: 400 });
    }
    if (result.status === 400 && result.body.error === 'invalid_action') {
      return NextResponse.json({ ok: false, error: t.invalidAction }, { status: 400 });
    }
    if (result.status !== 200) {
      return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      message: t.updated,
      areas: result.body.areas,
    });
  } catch (error) {
    log.error(t.updatingAreas + ':', error);
    return NextResponse.json({ ok: false, error: t.updatingAreas }, { status: 500 });
  }
}
