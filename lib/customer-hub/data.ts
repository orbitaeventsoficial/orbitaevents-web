import { Prisma, type CustomerDiscountCode, type Proposal, type Task } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { findTaskLinkByTaskOrLegacyId } from '@/lib/services/tasks/leadScopedTaskService';
import { readCustomerActivityLog, type CustomerActivityLogEntry } from '@/lib/services/customerActivityService';

export type CustomerHubCustomer = Prisma.CustomerGetPayload<{
  select: {
    id: true;
    customerNumber: true;
    name: true;
    email: true;
    phone: true;
    phoneNormalized: true;
    instagram: true;
    createdAt: true;
    tags: true;
    lifecycleStage: true;
    healthScore: true;
    preferences: true;
    birthday: true;
    lastContactedAt: true;
    lastEventDate: true;
    preferredLocale: true;
    marketingConsent: true;
    totalEvents: true;
    totalSpent: true;
    referredBy: { select: { id: true; name: true; email: true } };
    referrals: { select: { id: true; name: true; email: true; totalEvents: true; totalSpent: true } };
  };
}>;

export type CustomerHubLead = Prisma.LeadGetPayload<{
  include: {
    activities: true;
    universalTasks: true;
    booking: { select: { id: true; reference: true; status: true; total: true; depositAmount: true; remainingAmount: true; discountCode: true; eventType: true; eventDate: true; eventStartTime: true; eventEndTime: true; eventLocation: true; eventVenue: true; distanceKm: true; guestCount: true; depositPaid: true; remainingPaid: true } };
  };
}>;

export type CustomerHubBooking = Prisma.BookingGetPayload<{
  include: { pack: { include: { translations: true } } };
}>;

export type CustomerHubActivityLite = CustomerActivityLogEntry;

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

  const taskLink = await safeQuery(() => findTaskLinkByTaskOrLegacyId(entityId), null);
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
      customerNumber: true,
      name: true,
      email: true,
      phone: true,
      phoneNormalized: true,
      instagram: true,
      createdAt: true,
      tags: true,
      lifecycleStage: true,
      healthScore: true,
      preferences: true,
      birthday: true,
      lastContactedAt: true,
      lastEventDate: true,
      preferredLocale: true,
      marketingConsent: true,
      totalEvents: true,
      totalSpent: true,
      referredBy: { select: { id: true, name: true, email: true } },
      referrals: { select: { id: true, name: true, email: true, totalEvents: true, totalSpent: true } },
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
          universalTasks: { orderBy: { createdAt: 'desc' }, take: 60 },
          booking: { select: { id: true, reference: true, status: true, total: true, depositAmount: true, remainingAmount: true, discountCode: true, eventType: true, eventDate: true, eventStartTime: true, eventEndTime: true, eventLocation: true, eventVenue: true, distanceKm: true, guestCount: true, depositPaid: true, remainingPaid: true } },
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

  const bookingsRows = bookingsRaw.length > 0 ? bookingsRaw : bookingsFallbackRaw;

  const customerTasks: Task[] = await safeQuery(
    () =>
      prisma.task.findMany({
        where: { customerId },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 120,
      }),
    []
  );

  const activityLog: CustomerActivityLogEntry[] = await safeQuery(
    () => readCustomerActivityLog(customerId),
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
    bookingsRows,
    customerTasks,
    activityLog,
    customerDiscountCodes,
  };
}

async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    log.error('[CustomerHub] safeQuery error:', error);
    return fallback;
  }
}
