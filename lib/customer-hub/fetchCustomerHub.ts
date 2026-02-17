import { prisma } from '@/lib/prisma';
import type { CustomerHubDTO, DiscountCodeDTO, HubStatus, MessageDTO, TaskDTO } from './dto';
import { resolveActiveDocument } from './proposalActive';
import { buildTimeline } from './timeline';

function deriveHubStatus(input: {
  leadStatuses: string[];
  bookingStatuses: string[];
  manualStatus?: HubStatus | null;
}): HubStatus {
  if (input.manualStatus) return input.manualStatus;
  if (input.bookingStatuses.some((s) => s === 'COMPLETED')) return 'POSTEVENT';
  if (input.bookingStatuses.some((s) => s === 'CONFIRMED' || s === 'PREPARING')) return 'CONFIRMED';
  if (input.leadStatuses.some((s) => s === 'WON')) return 'CONFIRMED';
  if (input.leadStatuses.some((s) => s === 'NEGOTIATING' || s === 'QUOTE_SENT' || s === 'CONTACTED')) {
    return 'NEGOTIATION';
  }
  if (input.leadStatuses.some((s) => s === 'LOST')) return 'LOST';
  return 'LEAD';
}

export async function fetchCustomerHub(customerId: string): Promise<CustomerHubDTO> {
  const prismaAny = prisma as any;
  const resolvedCustomerId = await resolveCustomerId(prismaAny, customerId);
  if (!resolvedCustomerId) throw new Error('Customer not found');

  const customerBase: any = await prismaAny.customer.findUnique({
    where: { id: resolvedCustomerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });

  if (!customerBase) throw new Error('Customer not found');

  const leads: any[] = await safeQuery(() =>
    prismaAny.lead.findMany({
      where: { customerId: resolvedCustomerId },
      orderBy: { createdAt: 'desc' },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 60 },
        tasks: { orderBy: { createdAt: 'desc' }, take: 60 },
      },
    }),
    []
  );

  const leadIds = leads.map((l: any) => l.id);

  const proposals: any[] = await safeQuery(() =>
    prismaAny.proposal.findMany({
      where: { customerId: resolvedCustomerId },
      orderBy: { createdAt: 'desc' },
      take: 80,
    }),
    []
  );

  const bookingsRaw: any[] = await safeQuery(
    () =>
      prismaAny.booking.findMany({
        where: { customerId: resolvedCustomerId },
        orderBy: { createdAt: 'desc' },
        take: 80,
        include: { pack: { include: { translations: true } } },
      }),
    []
  );

  const bookingsFallbackRaw: any[] =
    bookingsRaw.length > 0 || leadIds.length === 0
      ? []
      : await safeQuery(
          () =>
            prismaAny.booking.findMany({
              where: { leadId: { in: leadIds } },
              orderBy: { createdAt: 'desc' },
              take: 80,
              include: { pack: { include: { translations: true } } },
            }),
          []
        );

  const bookingsRows = bookingsRaw.length > 0 ? bookingsRaw : bookingsFallbackRaw;

  const customerTasks: any[] = await safeQuery(
    () =>
      prismaAny.task.findMany({
        where: { customerId: resolvedCustomerId },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 120,
      }),
    []
  );

  const activityLog: any[] = await safeQuery(
    () =>
      prismaAny.customerActivity.findMany({
        where: { customerId: resolvedCustomerId },
        orderBy: { createdAt: 'desc' },
        take: 120,
      }),
    []
  );

  const customerDiscountCodes: any[] = await safeQuery(
    () =>
      prismaAny.customerDiscountCode.findMany({
        where: { customerId: resolvedCustomerId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    []
  );

  const proposalsMapped = proposals.map((p: any) => ({
    id: p.id,
    reference: p.reference,
    status: p.status as 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED',
    total: Number(p.total || 0),
    createdAt: p.createdAt.toISOString(),
    sentAt: p.sentAt?.toISOString(),
    acceptedAt: p.acceptedAt?.toISOString(),
    snapshot: (p.snapshot as Record<string, unknown> | null) || undefined,
  }));

  const bookings = bookingsRows.map((b: any) => {
    // Resoldre nom del pack amb traduccions
    let packName = b.pack?.name || undefined;
    if (b.pack?.translations?.length > 0) {
      const caTranslation = b.pack.translations.find((t: any) => t.locale === 'ca');
      const esTranslation = b.pack.translations.find((t: any) => t.locale === 'es');
      packName = caTranslation?.name || esTranslation?.name || packName;
    }

    return {
      id: b.id,
      reference: b.reference,
      date: b.eventDate?.toISOString(),
      startTime: b.eventStartTime || undefined,
      endTime: b.eventEndTime || undefined,
      status: b.status,
      location: b.eventLocation || undefined,
      venue: b.eventVenue || undefined,
      depositAmount: typeof b.depositAmount === 'number' ? b.depositAmount : undefined,
      totalAmount: typeof b.total === 'number' ? b.total : undefined,
      eventType: b.eventType || undefined,
      packName,
      guestCount: typeof b.guestCount === 'number' ? b.guestCount : undefined,
      depositPaid: b.depositPaid ?? undefined,
      remainingPaid: b.remainingPaid ?? undefined,
      discountCode: b.discountCode || undefined,
    };
  });

  const tasks: TaskDTO[] = customerTasks.length > 0
    ? customerTasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate?.toISOString(),
      done: task.status === 'DONE',
      priority:
        task.priority === 'HIGH' || task.priority === 'MEDIUM' || task.priority === 'LOW'
          ? task.priority
          : undefined,
      leadId: task.leadId || undefined,
    }))
    : leads.flatMap((lead: any) =>
      lead.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate?.toISOString(),
        done: task.status === 'DONE',
        priority:
          task.priority === 'HIGH' || task.priority === 'MEDIUM' || task.priority === 'LOW'
            ? task.priority
            : undefined,
        leadId: lead.id,
      }))
    );

  const leadMessages: MessageDTO[] = leads.flatMap((lead: any) =>
    lead.activities
      .filter((activity: any) => ['EMAIL', 'NOTE', 'CALL', 'WHATSAPP'].includes(activity.type))
      .map((activity: any) => ({
        id: activity.id,
        channel: activity.type === 'EMAIL' ? 'EMAIL' : activity.type === 'WHATSAPP' ? 'WHATSAPP' : 'NOTE',
        subject: activity.title || undefined,
        bodyPreview: activity.description || undefined,
        createdAt: activity.createdAt.toISOString(),
        sentAt: activity.createdAt.toISOString(),
        leadId: lead.id,
      }))
  );

  const customerNotes: MessageDTO[] = activityLog.map((a: any) => ({
    id: `ca-${a.id}`,
    channel: 'NOTE',
    subject: a.action,
    bodyPreview: typeof a.details === 'object' ? JSON.stringify(a.details).slice(0, 160) : undefined,
    createdAt: a.createdAt.toISOString(),
  }));

  const messages = [...leadMessages, ...customerNotes]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 120);

  const active = resolveActiveDocument(proposalsMapped);
  const activeProposal = active.proposalId ? proposalsMapped.find((p: any) => p.id === active.proposalId) : undefined;

  const totalQuoted = proposalsMapped.reduce((sum: number, p: any) => sum + (p.total || 0), 0);
  const totalPaid = bookingsRows.reduce((sum: number, b: any) => sum + (b.depositPaid ? (b.depositAmount || 0) : 0), 0);
  const marginEstimated =
    activeProposal && typeof activeProposal.snapshot?.subtotal === 'number' && typeof activeProposal.snapshot?.total === 'number'
      ? Number(activeProposal.snapshot.total) - Number(activeProposal.snapshot.subtotal)
      : undefined;

  const nextEventDate = bookings
    .filter((b: any) => b.date && b.status !== 'CANCELLED')
    .sort((a: any, b: any) => ((a.date || '') > (b.date || '') ? 1 : -1))[0]?.date;

  const status = deriveHubStatus({
    leadStatuses: leads.map((l: any) => l.status),
    bookingStatuses: bookingsRows.map((b: any) => b.status),
    manualStatus: resolveManualStatus(activityLog),
  });

  const timeline = buildTimeline({
    proposals: proposalsMapped,
    bookings,
    tasks,
    messages,
    customerActivities: activityLog.map((a: any) => ({
      id: a.id,
      action: a.action,
      createdAt: a.createdAt,
    })),
    leadActivities: leads.flatMap((lead: any) =>
      lead.activities.map((a: any) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        createdAt: a.createdAt,
        leadId: lead.id,
      }))
    ),
  });

  const discountCodes: DiscountCodeDTO[] = (customerDiscountCodes || []).map((dc: any) => ({
    id: dc.id,
    code: dc.code,
    discountPercent: dc.discountPercent,
    validFrom: dc.validFrom?.toISOString(),
    validUntil: dc.validUntil?.toISOString(),
    maxUses: dc.maxUses,
    currentUses: dc.currentUses,
    sourceType: dc.sourceType,
    isActive: dc.isActive,
    usedAt: dc.usedAt?.toISOString(),
  }));

  return {
    customer: {
      id: customerBase.id,
      name: customerBase.name,
      email: customerBase.email || undefined,
      phone: customerBase.phone || undefined,
      status,
      createdAt: customerBase.createdAt.toISOString(),
    },
    kpis: {
      nextEventDate,
      lastContactAt: messages[0]?.createdAt,
      totalQuoted,
      totalPaid,
      marginEstimated,
    },
    active,
    proposals: proposalsMapped,
    bookings,
    tasks,
    messages,
    timeline,
    discountCodes,
  };
}

async function resolveCustomerId(prismaAny: any, entityId: string): Promise<string | null> {
  const customer = await prismaAny.customer.findUnique({
    where: { id: entityId },
    select: { id: true },
  });
  if (customer?.id) return customer.id;

  const lead = await safeQuery(
    () => prismaAny.lead.findUnique({ where: { id: entityId }, select: { customerId: true } }),
    null
  );
  if (lead?.customerId) return lead.customerId;

  const booking = await safeQuery(
    () => prismaAny.booking.findUnique({ where: { id: entityId }, select: { leadId: true } }),
    null
  );
  if (booking?.leadId) {
    const bookingLead = await safeQuery(
      () => prismaAny.lead.findUnique({ where: { id: booking.leadId }, select: { customerId: true } }),
      null
    );
    if (bookingLead?.customerId) return bookingLead.customerId;
  }

  const proposal = await safeQuery(
    () => prismaAny.proposal.findUnique({ where: { id: entityId }, select: { customerId: true } }),
    null
  );
  if (proposal?.customerId) return proposal.customerId;

  const task = await safeQuery(
    () => prismaAny.task.findUnique({ where: { id: entityId }, select: { customerId: true } }),
    null
  );
  if (task?.customerId) return task.customerId;

  const [leadTask, leadActivity, leadDocument] = await Promise.all([
    safeQuery(() => prismaAny.leadTask.findUnique({ where: { id: entityId }, select: { leadId: true } }), null),
    safeQuery(() => prismaAny.leadActivity.findUnique({ where: { id: entityId }, select: { leadId: true } }), null),
    safeQuery(() => prismaAny.leadDocument.findUnique({ where: { id: entityId }, select: { leadId: true } }), null),
  ]);

  const fallbackLeadId = leadTask?.leadId || leadActivity?.leadId || leadDocument?.leadId;
  if (!fallbackLeadId) return null;

  const fallbackLead = await safeQuery(
    () => prismaAny.lead.findUnique({ where: { id: fallbackLeadId }, select: { customerId: true } }),
    null
  );

  return fallbackLead?.customerId || null;
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

function resolveManualStatus(activities: Array<{ action?: string; details?: unknown }>): HubStatus | null {
  const lastStatusChange = activities.find((activity) => activity?.action === 'STATUS_CHANGED');
  const raw = (lastStatusChange?.details as { newStatus?: string } | null)?.newStatus;
  if (!raw) return null;
  const allowed: HubStatus[] = ['LEAD', 'NEGOTIATION', 'CONFIRMED', 'POSTEVENT', 'LOST'];
  return allowed.includes(raw as HubStatus) ? (raw as HubStatus) : null;
}
