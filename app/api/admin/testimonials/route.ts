import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { listAdminTestimonials, moderateTestimonial } from '@/lib/services/testimonialAdminService';

export const dynamic = 'force-dynamic';

function normalizePositiveInteger(value: string | null, fallback: number, max?: number): number {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  return max ? Math.min(normalized, max) : normalized;
}

function normalizeNonNegativeInteger(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const result = await listAdminTestimonials({
    status: searchParams.get('status'),
    limit: normalizePositiveInteger(searchParams.get('limit'), 50, 200),
    offset: normalizeNonNegativeInteger(searchParams.get('offset')),
  });

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const result = await moderateTestimonial(body?.id, body?.action);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to update testimonial' }, { status: 500 });
  }
}
