import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { recordPostEventRecurrenceDecision } from '@/lib/services/postEventRecurrenceDecisionService';

const recurrenceDecisionSchema = z.object({
  customerId: z.string().min(1).max(120),
  bookingId: z.string().min(1).max(120),
  actionKey: z.enum(['testimonial', 'social_post', 'referral_ask']),
  draft: z.string().min(1).max(4000),
  href: z.string().min(1).max(500),
  source: z.string().min(1).max(120).optional(),
});

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const parsed = recurrenceDecisionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await recordPostEventRecurrenceDecision(parsed.data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error registrant decisio post-event', error, {
      context: { endpoint: 'admin/post-event/recurrence-decision:POST' },
    });
    return NextResponse.json({ ok: false, error: 'Error registrant decisio post-event' }, { status: 500 });
  }
}
