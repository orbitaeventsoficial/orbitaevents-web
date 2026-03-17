import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listAdminTestimonials, moderateTestimonial } from '@/lib/services/testimonialAdminService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const result = await listAdminTestimonials({
    status: searchParams.get('status'),
    limit: Number(searchParams.get('limit') || 50),
    offset: Number(searchParams.get('offset') || 0),
  });

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const result = await moderateTestimonial(body?.id, body?.action);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to update testimonial' }, { status: 500 });
  }
}
