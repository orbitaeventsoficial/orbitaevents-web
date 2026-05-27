// app/api/admin/leads/route.ts
// API per gestionar leads (nou model)
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { safeParseInt } from '@/lib/utils';
import { z } from 'zod';
import { getPipelineLeads } from '@/lib/services/leads/pipeline';
import { countNewAdminLeads, createAdminLead, listAdminLeads } from '@/lib/services/leadAdminService';
import { linkLeadToCustomer, previewLeadCustomerLink } from '@/lib/services/leads/leadCustomerLinkService';
import { EVENT_TYPE_VALUES, LEAD_SOURCE_VALUES, LEAD_STATUS_VALUES, PRIORITY_VALUES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type LeadStatus = typeof LEAD_STATUS_VALUES[number];
type EventType = typeof EVENT_TYPE_VALUES[number];
type Priority = typeof PRIORITY_VALUES[number];
type LeadSource = typeof LEAD_SOURCE_VALUES[number];

async function linkManualLeadToCustomer(leadId: string) {
  const preview = await previewLeadCustomerLink(leadId);

  if (preview.kind === 'already-linked') {
    return { linked: true, created: false, alreadyLinked: true, customerId: preview.customer.customerId };
  }

  if (preview.kind === 'matches-found') {
    const strongMatch = preview.matches.find((match) => match.confidence === 'strong');
    if (strongMatch) {
      const linked = await linkLeadToCustomer({
        leadId,
        action: 'link',
        customerId: strongMatch.customerId,
        actor: 'Admin intake',
      });
      return linked.ok
        ? { linked: true, created: false, alreadyLinked: false, customerId: linked.customerId }
        : { linked: false, created: false, alreadyLinked: false, error: linked.error };
    }
  }

  const created = await linkLeadToCustomer({
    leadId,
    action: 'create',
    actor: 'Admin intake',
  });

  return created.ok
    ? { linked: true, created: created.created, alreadyLinked: created.alreadyLinked, customerId: created.customerId }
    : { linked: false, created: false, alreadyLinked: false, error: created.error };
}

function isValidStatus(value: string | null): value is LeadStatus {
  return value !== null && LEAD_STATUS_VALUES.includes(value as LeadStatus);
}

function isValidEventType(value: string | null): value is EventType {
  return value !== null && EVENT_TYPE_VALUES.includes(value as EventType);
}

function isValidPriority(value: string | null): value is Priority {
  return value !== null && PRIORITY_VALUES.includes(value as Priority);
}

function isValidSource(value: string | null): value is LeadSource {
  return value !== null && LEAD_SOURCE_VALUES.includes(value as LeadSource);
}

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  eventType: z.enum(EVENT_TYPE_VALUES),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  eventVenue: z.string().optional(),
  guestCount: z.number().optional(),
  budget: z.string().optional(),
  message: z.string().optional(),
  dni: z.string().optional(),
  interestedPackId: z.string().optional(),
  interestedExtras: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  source: z.enum(LEAD_SOURCE_VALUES).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  priority: z.enum(PRIORITY_VALUES).optional(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const pipelineMode = searchParams.get('pipeline') === 'true';

    if (pipelineMode) {
      const pipelineLimit = safeParseInt(searchParams.get('limit'), 200, 1, 500);
      const statusParams = searchParams.getAll('status').filter(isValidStatus);
      const eventTypeParams = searchParams.getAll('eventType').filter(isValidEventType);
      const priorityParams = searchParams.getAll('priority').filter(isValidPriority);
      const sourceParams = searchParams.getAll('source').filter(isValidSource);
      const search = searchParams.get('search') || searchParams.get('q');
      const fromParam = searchParams.get('from');
      const toParam = searchParams.get('to');

      const fromDate = fromParam ? new Date(fromParam) : null;
      const toDate = toParam ? new Date(toParam) : null;
      const validFrom = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null;
      const validTo = toDate && !Number.isNaN(toDate.getTime()) ? toDate : null;
      if (validTo) validTo.setHours(23, 59, 59, 999);

      const where = {
        ...(statusParams.length > 0 && { status: { in: statusParams } }),
        ...(eventTypeParams.length > 0 && { eventType: { in: eventTypeParams } }),
        ...(priorityParams.length > 0 && { priority: { in: priorityParams } }),
        ...(sourceParams.length > 0 && { source: { in: sourceParams } }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
        }),
        ...(validFrom || validTo
          ? {
              eventDate: {
                ...(validFrom ? { gte: validFrom } : {}),
                ...(validTo ? { lte: validTo } : {}),
              },
            }
          : {}),
      };

      const leads = await getPipelineLeads(pipelineLimit, where);
      return NextResponse.json({ ok: true, data: { leads } });
    }

    const countOnly = searchParams.get('countOnly') === 'true';
    if (countOnly) {
      const result = await countNewAdminLeads();
      return NextResponse.json(result);
    }

    const statusParam = searchParams.get('status');
    const eventTypeParam = searchParams.get('eventType');
    const priorityParam = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = safeParseInt(searchParams.get('page'), 1, 1);
    const limit = safeParseInt(searchParams.get('limit'), 25, 1, 200);

    const result = await listAdminLeads({
      status: isValidStatus(statusParam) ? statusParam : null,
      eventType: isValidEventType(eventTypeParam) ? eventTypeParam : null,
      priority: isValidPriority(priorityParam) ? priorityParam : null,
      search,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    log.error('Error obtenint leads:', { message: errMsg, stack: errStack });
    return NextResponse.json(
      { error: 'Error obtenint leads', details: errMsg },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createAdminLead({ ...parsed.data, status: 'CONTACTED' });

    const customerLink = result?.lead?.id
      ? await linkManualLeadToCustomer(result.lead.id)
      : null;

    // Els leads creats manualment a l'admin no disparen automatismes d'entrada externa.
    if (result?.lead?.id) {
      result.lead.customerId = customerLink?.customerId || result.lead.customerId || null;
    }

    return NextResponse.json({ ...result, customerLink });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error('Error creant lead:', { message: errMsg });
    return NextResponse.json(
      { error: 'Error creant lead', details: errMsg },
      { status: 500 }
    );
  }
}
