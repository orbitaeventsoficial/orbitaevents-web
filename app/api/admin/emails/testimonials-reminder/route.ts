import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { countPendingTestimonials } from '@/lib/services/testimonialAdminService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const pendingCount = await countPendingTestimonials();
    return NextResponse.json({ ok: true, pendingCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
