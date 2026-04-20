import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { getTopTags } from '@/lib/services/customerSegmentationService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/customers/segments/tags
 * Retorna els tags més usats amb comptadors.
 */
export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const tags = await getTopTags(30);
    return NextResponse.json({ ok: true, tags });
  } catch (error) {
    log.error('Error obtenint tags', error);
    return NextResponse.json({ ok: false, error: 'Error obtenint tags' }, { status: 500 });
  }
}
