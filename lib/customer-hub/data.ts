import { Prisma, type CustomerDiscountCode, type Proposal, type Task } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { findTaskLinkByTaskId } from '@/lib/services/tasks/leadScopedTaskService';
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
    booking: { select: { id: true; reference: true; status: true; total: true; depositAmount: true; remainingAmount: true; cashAmount: true; discountCode: true; eventType: true; eventDate: true; eventStartTime: true; eventEndTime: true; eventLocation: true; eventVenue: true; distanceKm: true; guestCount: true; depositPaid: true; remainingPaid: true } };
  };
}>;

export type CustomerHubBooking = Prisma.BookingGetPayload<{
  include: {
    pack: { include: { translations: true } };
    invoices: {
      select: {
        id: true;
        reference: true;
        status: true;
        total: true;
        pdfUrl: true;
        holdedInvoiceUrl: true;
        createdAt: true;
      };
    };
    deliveryNotes: {
      select: {
        id: true;
        reference: true;
        status: true;
        pdfUrl: true;
        deliveredAt: true;
        signedAt: true;
        createdAt: true;
      };
    };
    postEventReport: {
      select: {
        id: true;
        status: true;
        completedAt: true;
        createdAt: true;
        soundQuality: true;
        maxDancefloor: true;
        hadIncidents: true;
      };
    };
    clientSurvey: {
      select: {
        id: true;
        submittedAt: true;
        overallRating: true;
        npsScore: true;
        testimonialPermission: true;
        createdTestimonialId: true;
      };
    };
  };
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

async function resolveCustomerIdFromLeadId(leadId: string): Promise<string | null> {
  const lead = await safeQuery(
    () => prisma.lead.findUnique({ where: { id: leadId }, select: { customerId: true } }),
    null
  );
  return lead?.customerId || null;
}

async function resolveCustomerIdFromBookingId(bookingId: string): Promise<string | null> {
  const booking = await safeQuery(
    () => prisma.booking.findUnique({ where: { id: bookingId }, select: { customerId: true, leadId: true } }),
    null
  );
  if (booking?.customerId) return booking.customerId;
  if (booking?.leadId) return resolveCustomerIdFromLeadId(booking.leadId);
  return null;
}

export async function resolveCustomerHubCustomerId(entityId: string): Promise<string | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: entityId },
    select: { id: true, mergedIntoId: true },
  });
  if (customer?.mergedIntoId) return customer.mergedIntoId;
  if (customer?.id) return customer.id;

  const leadCustomerId = await resolveCustomerIdFromLeadId(entityId);
  if (leadCustomerId) return leadCustomerId;

  const bookingCustomerId = await resolveCustomerIdFromBookingId(entityId);
  if (bookingCustomerId) return bookingCustomerId;

  const proposal = await safeQuery(
    () => prisma.proposal.findUnique({ where: { id: entityId }, select: { customerId: true, leadId: true, bookingId: true } }),
    null
  );
  if (proposal?.customerId) return proposal.customerId;
  if (proposal?.leadId) {
    const proposalLeadCustomerId = await resolveCustomerIdFromLeadId(proposal.leadId);
    if (proposalLeadCustomerId) return proposalLeadCustomerId;
  }
  if (proposal?.bookingId) {
    const proposalBookingCustomerId = await resolveCustomerIdFromBookingId(proposal.bookingId);
    if (proposalBookingCustomerId) return proposalBookingCustomerId;
  }

  const dossier = await safeQuery(
    () => prisma.dossier.findUnique({ where: { id: entityId }, select: { leadId: true } }),
    null
  );
  if (dossier?.leadId) {
    const dossierLeadCustomerId = await resolveCustomerIdFromLeadId(dossier.leadId);
    if (dossierLeadCustomerId) return dossierLeadCustomerId;
  }

  const invoice = await safeQuery(
    () => prisma.invoice.findUnique({ where: { id: entityId }, select: { customerId: true, bookingId: true } }),
    null
  );
  if (invoice?.customerId) return invoice.customerId;
  if (invoice?.bookingId) {
    const invoiceBookingCustomerId = await resolveCustomerIdFromBookingId(invoice.bookingId);
    if (invoiceBookingCustomerId) return invoiceBookingCustomerId;
  }

  const taskLink = await safeQuery(() => findTaskLinkByTaskId(entityId), null);
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
          booking: { select: { id: true, reference: true, status: true, total: true, depositAmount: true, remainingAmount: true, cashAmount: true, discountCode: true, eventType: true, eventDate: true, eventStartTime: true, eventEndTime: true, eventLocation: true, eventVenue: true, distanceKm: true, guestCount: true, depositPaid: true, remainingPaid: true } },
        },
      }),
    []
  );
}

export async function fetchCustomerHubCollections(customerId: string, leadIds: string[]) {
  const customerOrLeadWhere = leadIds.length > 0
    ? { OR: [{ customerId }, { leadId: { in: leadIds } }] }
    : { customerId };

  const proposals: Proposal[] = await safeQuery(
    () =>
      prisma.proposal.findMany({
        where: customerOrLeadWhere,
        orderBy: { createdAt: 'desc' },
        take: 80,
      }),
    []
  );

  const bookingsRaw: CustomerHubBooking[] = await safeQuery(
    () =>
      prisma.booking.findMany({
        where: customerOrLeadWhere,
        orderBy: { createdAt: 'desc' },
        take: 80,
        include: {
          pack: { include: { translations: true } },
          invoices: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              reference: true,
              status: true,
              total: true,
              pdfUrl: true,
              holdedInvoiceUrl: true,
              createdAt: true,
            },
          },
          deliveryNotes: {
            orderBy: [{ signedAt: 'desc' }, { createdAt: 'desc' }],
            select: {
              id: true,
              reference: true,
              status: true,
              pdfUrl: true,
              deliveredAt: true,
              signedAt: true,
              createdAt: true,
            },
          },
          postEventReport: {
            select: {
              id: true,
              status: true,
              completedAt: true,
              createdAt: true,
              soundQuality: true,
              maxDancefloor: true,
              hadIncidents: true,
            },
          },
          clientSurvey: {
            select: {
              id: true,
              submittedAt: true,
              overallRating: true,
              npsScore: true,
              testimonialPermission: true,
              createdTestimonialId: true,
            },
          },
        },
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
    bookingsRows: bookingsRaw,
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
