import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import { CustomerLifecycle } from '@prisma/client';
import { z } from 'zod';
import { querySegment } from '@/lib/services/customerSegmentationService';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  lifecycleStage: z.nativeEnum(CustomerLifecycle).optional(),
  tag: z.string().optional(),
  healthScoreMin: z.coerce.number().min(0).max(100).optional(),
  healthScoreMax: z.coerce.number().min(0).max(100).optional(),
  minSpent: z.coerce.number().min(0).optional(),
  maxSpent: z.coerce.number().min(0).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

/**
 * GET /api/admin/customers/segments?lifecycleStage=VIP&tag=Corporatiu&page=1
 * Consultar un segment de clients amb filtres combinats.
 */
export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = querySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Paràmetres invàlids', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { page, limit, ...filter } = parsed.data;
    const result = await querySegment(filter, page, limit);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error('Error consultant segment', error);
    return NextResponse.json({ ok: false, error: 'Error consultant segment' }, { status: 500 });
  }
}
