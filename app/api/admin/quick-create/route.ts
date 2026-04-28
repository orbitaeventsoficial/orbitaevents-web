import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { quickCreate } from '@/lib/services/leads/quickCreateFlow';

const quickCreateSchema = z.object({
  outcome: z.enum(['lead', 'lead+proposal', 'lead+proposal+booking']),
  client: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    dni: z.string().optional(),
  }),
  event: z.object({
    eventType: z.string().min(1),
    eventDate: z.string().optional(),
    eventStartTime: z.string().optional(),
    eventEndTime: z.string().optional(),
    eventLocation: z.string().optional(),
    eventVenue: z.string().optional(),
    guestCount: z.number().int().min(0).optional(),
    message: z.string().optional(),
    interestedPackId: z.string().optional(),
    budget: z.string().optional(),
  }),
  proposalSubtotal: z.number().min(0).optional(),
  proposalSnapshot: z.record(z.unknown()).optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body invàlid' }, { status: 400 });
  }

  const parsed = quickCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await quickCreate(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, stage: result.stage },
        { status: result.status },
      );
    }
    return NextResponse.json({
      ok: true,
      leadId: result.leadId,
      proposalId: result.proposalId,
      bookingId: result.bookingId,
    });
  } catch (error) {
    log.error('Error al quick-create', error, { context: { endpoint: 'POST /api/admin/quick-create' } });
    return NextResponse.json({ ok: false, error: 'Error inesperat' }, { status: 500 });
  }
}
