import { Prisma, type CustomerActivity, type CustomerDiscountCode, type Proposal, type Task } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { findLeadTaskLinkByTaskOrLegacyId } from '@/lib/services/tasks/leadTaskFacade';

export type CustomerHubCustomer = Prisma.CustomerGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    phone: true;
    createdAt: true;
  };
}>;

export type CustomerHubLead = Prisma.LeadGetPayload<{
  include: {
    activities: true;
    tasks: true;
    booking: { select: { id: true; reference: true; status: true; total: true } };
  };
}>;

export type CustomerHubBooking = Prisma.BookingGetPayload<{
  include: { pack: { include: { translations: true } } };
}>;

export type CustomerHubActivityLite = {
  id: string;
  action: string;
  createdAt: Date;
  details: Prisma.JsonValue | null;
};

export type CustomerHubTaskLite = {
  id: string;
  title: string;
  dueDate: Date | null;
  status: string;
  priority: string | null;
  leadId: string | null;
};

export async function resolveCustomerHubCustomerId(entityId: string): Promise<string | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: entityId },
    select: { id: true },
  });
  if (customer?.id) return customer.id;

  const lead = await safeQuery(
    () => prisma.lead.findUnique({ where: { id: entityId }, select: { customerId: true } }),
    null
  );
  if (lead?.customerId) return lead.customerId;

  const booking = await safeQuery(
    () => prisma.booking.findUnique({ where: { id: entityId }, select: { leadId: true } }),
    null
  );
  if (booking?.leadId) {
    const bookingLeadId = booking.leadId;
    const bookingLead = await safeQuery(
      () => prisma.lead.findUnique({ where: { id: bookingLeadId }, select: { customerId: true } }),
      null
    );
    if (bookingLead?.customerId) return bookingLead.customerId;
  }

  const proposal = await safeQuery(
    () => prisma.proposal.findUnique({ where: { id: entityId }, select: { customerId: true } }),
    null
  );
  if (proposal?.customerId) return proposal.customerId;

  const taskLink = await safeQuery(() => findLeadTaskLinkByTaskOrLegacyId(entityId), null);
  if (taskLink?.customerId) return taskLink.customerId;

  const [leadActivity, leadDocument] = await Promise.all([
    safeQuery(
      () => prisma.leadActivity.findUnique({ where: { id: entityId }, select: { leadId: true } }),
      null
    ),
    safeQuery(
      () => prisma.leadDocument.findUnique({ where: { id: entityId }, select: { leadId: true } }),
      null
    ),
  ]);

  const fallbackLeadId = taskLink?.leadId || leadActivity?.leadId || leadDocument?.leadId;
  if (!fallbackLeadId) return null;

  const fallbackLead = await safeQuery(
    () => prisma.lead.findUnique({ where: { id: fallbackLeadId }, select: { customerId: true } }),
    null
  );

  return fallbackLead?.customerId || null;
}

export async function fetchCustomerHubCustomerBase(
  customerId: string
): Promise<CustomerHubCustomer | null> {
  return prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });
}

export async function fetchCustomerHubLeads(customerId: string): Promise<CustomerHubLead[]> {
  return safeQuery(
    () =>
      prisma.lead.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        include: {
          activities: { orderBy: { createdAt: 'desc' }, take: 60 },
          tasks: { orderBy: { createdAt: 'desc' }, take: 60 },
          booking: { select: { id: true, reference: true, status: true, total: true } },
        },
      }),
    []
  );
}

export async function fetchCustomerHubCollections(customerId: string, leadIds: string[]) {
  const proposals: Proposal[] = await safeQuery(
    () =>
      prisma.proposal.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
    []
  );

  const bookingsRaw: CustomerHubBooking[] = await safeQuery(
    () =>
      prisma.booking.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 80,
        include: { pack: { include: { translations: true } } },
      }),
    []
  );

  const bookingsFallbackRaw: CustomerHubBooking[] =
    bookingsRaw.length > 0 || leadIds.length === 0
      ? []
      : await safeQuery(
          () =>
            prisma.booking.findMany({
              where: { leadId: { in: leadIds } },
              orderBy: { createdAt: 'desc' },
              take: 80,
              include: { pack: { include: { translations: true } } },
            }),
          []
        );

  const customerTasks: Task[] = await safeQuery(
    () =>
      prisma.task.findMany({
        where: { customerId },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 120,
      }),
    []
  );

  const activityLog: CustomerActivity[] = await safeQuery(
    () =>
      prisma.customerActivity.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 120,
      }),
    []
  );

  const customerDiscountCodes: CustomerDiscountCode[] = await safeQuery(
    () =>
      prisma.customerDiscountCode.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    []
  );

  return {
    proposals,
    bookingsRows: bookingsRaw.length > 0 ? bookingsRaw : bookingsFallbackRaw,
    customerTasks,
    activityLog,
    customerDiscountCodes,
  };
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error('[CustomerHub] safeQuery error:', error);
    return fallback;
  }
}

