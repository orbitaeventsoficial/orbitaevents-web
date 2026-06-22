// app/api/admin/pricing/route.ts
// API unificada per gestionar preus i veure dades vinculades
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getPricingAdminData, normalizePricingLocale, updateExtraPrice } from '@/lib/services/pricingAdminService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const locale = normalizePricingLocale(searchParams.get('locale'));
    const result = await getPricingAdminData(locale);
    return NextResponse.json(result);
  } catch (error) {
    log.error('Error obtenint preus:', error);
    return NextResponse.json(
      { error: 'Error obtenint dades de preus' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const body = await req.json();
    const result = await updateExtraPrice(body?.extraId, body?.price);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant preu:', error);
    return NextResponse.json(
      { error: 'Error actualitzant preu' },
      { status: 500 }
    );
  }
}
