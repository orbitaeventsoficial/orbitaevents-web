import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { log } from '@/lib/logger';
import { calculateGoogleMapsDistance } from '@/lib/services/googleMapsDistance';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  destination: z.string().min(3),
  origin: z.string().min(3).optional(),
});

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'INVALID_BODY' }, { status: 400 });
    }
    const body = parsed.data;
    const result = await calculateGoogleMapsDistance({
      destination: body.destination,
      origin: body.origin,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    log.error('Error calculant distància Google Maps', error, { context: { endpoint: 'POST /api/admin/maps/distance' } });
    const msg = error instanceof Error ? error.message : 'DISTANCE_CALCULATION_FAILED';
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 400 }
    );
  }
}
