import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { ensurePortfolioEventFromPostEventReport } from '@/lib/services/portfolioEventService';

const bodySchema = z.object({
  bookingId: z.string().min(1).max(120),
});

const STATUS_HTTP = {
  BOOKING_NOT_FOUND: 404,
  REPORT_REQUIRED: 409,
  PORTFOLIO_MEDIA_REQUIRED: 409,
  EXISTS: 200,
  CREATED: 201,
} as const;

const STATUS_MESSAGES = {
  BOOKING_NOT_FOUND: 'Reserva no trobada',
  REPORT_REQUIRED: 'Cal completar l informe post-event abans de crear portfolio',
  PORTFOLIO_MEDIA_REQUIRED: 'Marca una foto de la galeria com a portfolio i assigna categoria',
  EXISTS: 'Portfolio ja creat per aquesta reserva',
  CREATED: 'Draft de portfolio creat',
} as const;

type EnsurePortfolioEventWithEvent = Extract<
  Awaited<ReturnType<typeof ensurePortfolioEventFromPostEventReport>>,
  { event: unknown }
>;

function serializePortfolioEvent(event: EnsurePortfolioEventWithEvent['event']) {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    categorySlug: event.categorySlug,
    published: event.published,
    adminHref: '/admin/portfolio#events',
    publicHref: `/portfolio/${event.categorySlug}/${event.slug}`,
  };
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invalides', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await ensurePortfolioEventFromPostEventReport(parsed.data.bookingId);
    const event = 'event' in result ? serializePortfolioEvent(result.event) : null;
    const ok = result.status === 'CREATED' || result.status === 'EXISTS';

    return NextResponse.json(
      {
        ok,
        status: result.status,
        message: STATUS_MESSAGES[result.status],
        event,
      },
      { status: STATUS_HTTP[result.status] },
    );
  } catch (error) {
    log.error('Error assegurant portfolio post-event', error, {
      context: { endpoint: 'admin/post-event/portfolio-event:POST' },
    });
    return NextResponse.json({ ok: false, error: 'Error creant portfolio post-event' }, { status: 500 });
  }
}
