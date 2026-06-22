import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import {
  ensureCoverageAreasSetting,
  updateCoverageAreas,
} from '@/lib/coverage';
import { ADMIN_COVERAGE_API_MESSAGES, type AdminCoverageApiLocale } from '@/lib/constants';

export const dynamic = 'force-dynamic';

function resolveLocale(req: NextRequest): AdminCoverageApiLocale {
  const lang = req.headers.get('accept-language')?.toLowerCase() || '';
  if (lang.includes('ca')) return 'ca';
  if (lang.includes('en')) return 'en';
  return 'es';
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const t = ADMIN_COVERAGE_API_MESSAGES[resolveLocale(req)];

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
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const t = ADMIN_COVERAGE_API_MESSAGES[resolveLocale(req)];

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
