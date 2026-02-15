import { prisma } from '@/lib/prisma';
import type { CustomerHubDTO, HubStatus, MessageDTO, TaskDTO } from './dto';
import { resolveActiveDocument } from './proposalActive';
import { buildTimeline } from './timeline';

function deriveHubStatus(input: {
  leadStatuses: string[];
  bookingStatuses: string[];
}): HubStatus {
  if (input.bookingStatuses.some((s) => s === 'COMPLETED')) return 'POSTEVENT';
  if (input.bookingStatuses.some((s) => s === 'CONFIRMED' || s === 'PREPARING')) return 'CONFIRMED';
  if (input.leadStatuses.some((s) => s === 'NEGOTIATING' || s === 'QUOTE_SENT' || s === 'CONTACTED')) {
    return 'NEGOTIATION';
  }
  if (input.leadStatuses.some((s) => s === 'LOST')) return 'LOST';
  return 'LEAD';
}

export async function fetchCustomerHub(customerId: string): Promise<CustomerHubDTO> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      proposals: { orderBy: { createdAt: 'desc' }, take: 80 },
      bookings: { orderBy: { createdAt: 'desc' }, take: 80 },
      activityLog: { orderBy: { createdAt: 'desc' }, take: 120 },
      leads: {
        orderBy: { createdAt: 'desc' },
        include: {
          activities: { orderBy: { createdAt: 'desc' }, take: 60 },
          tasks: { orderBy: { createdAt: 'desc' }, take: 60 },
        },
      },
    },
  });

  if (!customer) throw new Error('Customer not found');

  const proposals = customer.proposals.map((p) => ({
    id: p.id,
    reference: p.reference,
    status: p.status as 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED',
    total: Number(p.total || 0),
    createdAt: p.createdAt.toISOString(),
    sentAt: p.sentAt?.toISOString(),
    acceptedAt: p.acceptedAt?.toISOString(),
    snapshot: (p.snapshot as Record<string, unknown> | null) || undefined,
  }));

  const bookings = customer.bookings.map((b) => ({
    id: b.id,
    reference: b.reference,
    date: b.eventDate?.toISOString(),
    startTime: b.eventStartTime || undefined,
    endTime: b.eventEndTime || undefined,
    status: b.status,
    location: b.eventLocation || undefined,
    depositAmount: typeof b.depositAmount === 'number' ? b.depositAmount : undefined,
    totalAmount: typeof b.total === 'number' ? b.total : undefined,
  }));

  const tasks: TaskDTO[] = customer.leads.flatMap((lead) =>
    lead.tasks.map((task) => ({
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

  const leadMessages: MessageDTO[] = customer.leads.flatMap((lead) =>
    lead.activities
      .filter((activity) => ['EMAIL', 'NOTE', 'CALL', 'WHATSAPP'].includes(activity.type))
      .map((activity) => ({
        id: activity.id,
        channel: activity.type === 'EMAIL' ? 'EMAIL' : activity.type === 'WHATSAPP' ? 'WHATSAPP' : 'NOTE',
        subject: activity.title || undefined,
        bodyPreview: activity.description || undefined,
        createdAt: activity.createdAt.toISOString(),
        sentAt: activity.createdAt.toISOString(),
        leadId: lead.id,
      }))
  );

  const customerNotes: MessageDTO[] = customer.activityLog.map((a) => ({
    id: `ca-${a.id}`,
    channel: 'NOTE',
    subject: a.action,
    bodyPreview: typeof a.details === 'object' ? JSON.stringify(a.details).slice(0, 160) : undefined,
    createdAt: a.createdAt.toISOString(),
  }));

  const messages = [...leadMessages, ...customerNotes]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 120);

  const active = resolveActiveDocument(proposals);
  const activeProposal = active.proposalId ? proposals.find((p) => p.id === active.proposalId) : undefined;

  const totalQuoted = proposals.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalPaid = customer.bookings.reduce((sum, b) => sum + (b.depositPaid ? (b.depositAmount || 0) : 0), 0);
  const marginEstimated =
    activeProposal && typeof activeProposal.snapshot?.subtotal === 'number' && typeof activeProposal.snapshot?.total === 'number'
      ? Number(activeProposal.snapshot.total) - Number(activeProposal.snapshot.subtotal)
      : undefined;

  const nextEventDate = bookings
    .filter((b) => b.date && b.status !== 'CANCELLED')
    .sort((a, b) => ((a.date || '') > (b.date || '') ? 1 : -1))[0]?.date;

  const status = deriveHubStatus({
    leadStatuses: customer.leads.map((l) => l.status),
    bookingStatuses: customer.bookings.map((b) => b.status),
  });

  const timeline = buildTimeline({
    proposals,
    bookings,
    tasks,
    messages,
    customerActivities: customer.activityLog.map((a) => ({
      id: a.id,
      action: a.action,
      createdAt: a.createdAt,
    })),
    leadActivities: customer.leads.flatMap((lead) =>
      lead.activities.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        createdAt: a.createdAt,
        leadId: lead.id,
      }))
    ),
  });

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      status,
      createdAt: customer.createdAt.toISOString(),
    },
    kpis: {
      nextEventDate,
      lastContactAt: messages[0]?.createdAt,
      totalQuoted,
      totalPaid,
      marginEstimated,
    },
    active,
    proposals,
    bookings,
    tasks,
    messages,
    timeline,
  };
}

