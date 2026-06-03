import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { buildRecentCommRowsFromTimeline, deriveFlowStatusFromTimeline } from '@/lib/services/communicationStatusService';
import { getBookingChecklist, type BookingChecklistItem } from '@/lib/services/bookingChecklistService';
import { getActivePortalAccessForBooking } from '@/lib/services/clientPortalAccess';
import { getProfitabilityConfig, type ProfitabilityConfig } from '@/lib/services/profitabilityService';
import { fetchCanonicalEventsForBooking, type CanonicalTimelineEvent } from '@/lib/services/timelineQueryService';
import { calculateCostPerHour, calculateEventDuration } from '@/lib/inventory-utils';
import { DEFAULT_EXPECTED_LIFE_HOURS } from '@/lib/constants';

// ─── Types ──────────────────────────────────────────────────────────────

type CommFlowStatus = {
  state: 'FALTA_ENVIAR' | 'ENVIADO' | 'RESPONDIDO';
  sentAt: Date | null;
  respondedAt: Date | null;
  lastChannel: string | null;
};

type ReviewFlowStatus = 'FALTA_ENVIAR' | 'ENVIADO' | 'RESPONDIDO';
type InternalPostEventStatus = 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETO';

type CustomerContext = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalEvents: number;
  totalSpent: number;
  lastEventDate: Date | null;
} | null;

type InventoryCost = {
  totalCost: number;
  hours: number;
  remainingHoursAvg: number | null;
  remainingHoursMin: number | null;
};

type PaymentSummary = {
  invoiceCount: number;
  totalInvoiced: number;
  depositAmount: number;
  remainingAmount: number;
};

type DocumentSummary = {
  proposalCount: number;
  hasSignedContract: boolean;
  invoiceCount: number;
};

type CommRow = {
  id: string;
  createdAt: Date;
  action: 'COMM_SENT' | 'COMM_RESPONDED';
  flow: string;
  channel: string;
};

type FlowKey = 'PAYMENT' | 'POST_EVENT' | 'GENERAL';

export type BookingOperationalSnapshot = {
  checklist: BookingChecklistItem[];
  commStatuses: Record<FlowKey, CommFlowStatus>;
  recentCommRows: CommRow[];
  reviewFlowStatus: ReviewFlowStatus;
  internalPostEventStatus: InternalPostEventStatus;
  timeline: CanonicalTimelineEvent[];
  customer: CustomerContext;
  portalAccess: Awaited<ReturnType<typeof getActivePortalAccessForBooking>>;
  profitabilityConfig: ProfitabilityConfig;
  targetMarginPct: number;
  inventoryCost: InventoryCost;
  payment: PaymentSummary;
  documents: DocumentSummary;
};

// ─── Helpers ────────────────────────────────────────────────────────────

async function safeFetch<T>(query: () => Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await query();
  } catch (error) {
    log.error(`[bookingOperationalService] ${context}`, error);
    return fallback;
  }
}

function deriveReviewFlowStatus(booking: {
  reviewSubmittedAt: Date | null;
  clientSurvey: unknown;
  postEventEmailSent: boolean | null;
}): ReviewFlowStatus {
  if (booking.reviewSubmittedAt || booking.clientSurvey) return 'RESPONDIDO';
  if (booking.postEventEmailSent) return 'ENVIADO';
  return 'FALTA_ENVIAR';
}

function deriveInternalPostEventStatus(booking: {
  postEventReport: unknown;
  clientFeedback: { sentAt: Date | null } | null;
}): InternalPostEventStatus {
  const hasReport = !!booking.postEventReport;
  const hasFeedback = !!booking.clientFeedback?.sentAt;
  if (hasReport && hasFeedback) return 'COMPLETO';
  if (hasReport || hasFeedback) return 'EN_PROGRESO';
  return 'PENDIENTE';
}

async function fetchCustomerContext(
  customerId: string | null,
  clientEmail: string,
): Promise<CustomerContext> {
  const select = { id: true, name: true, email: true, phone: true, totalEvents: true, totalSpent: true, lastEventDate: true } as const;
  if (customerId) {
    return prisma.customer.findUnique({ where: { id: customerId }, select });
  }
  return prisma.customer.findFirst({
    where: { emailNormalized: clientEmail.trim().toLowerCase() },
    select,
  });
}

async function computeInventoryCost(
  inventory: Array<{
    itemId: string;
    quantity: number | null;
    item: { purchasePrice: number | null; expectedLifeHours: number | null };
  }>,
  eventStartTime: string | null,
  eventEndTime: string | null,
): Promise<InventoryCost> {
  const hours = calculateEventDuration(eventStartTime, eventEndTime);
  if (inventory.length === 0) {
    return { totalCost: 0, hours, remainingHoursAvg: null, remainingHoursMin: null };
  }

  const itemIds = inventory.map((a) => a.itemId);
  const usageRows = await prisma.inventoryUsage.groupBy({
    by: ['itemId'],
    where: { itemId: { in: itemIds } },
    _sum: { hoursUsed: true },
  });
  const usageByItem = new Map(
    usageRows.map((row: { itemId: string; _sum: { hoursUsed: number | null } }) => [
      row.itemId,
      row._sum.hoursUsed || 0,
    ] as [string, number]),
  );

  let totalCost = 0;
  const remainingList: number[] = [];
  for (const assigned of inventory) {
    const perHour = calculateCostPerHour(assigned.item.purchasePrice, assigned.item.expectedLifeHours);
    totalCost += perHour * (assigned.quantity || 1) * hours;
    const expectedLife = assigned.item.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS;
    const used = usageByItem.get(assigned.itemId) || 0;
    remainingList.push(Math.max(0, expectedLife - used));
  }

  return {
    totalCost,
    hours,
    remainingHoursAvg: remainingList.length > 0
      ? remainingList.reduce((a, b) => a + b, 0) / remainingList.length
      : null,
    remainingHoursMin: remainingList.length > 0
      ? Math.min(...remainingList)
      : null,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────

/**
 * Retorna l'snapshot operacional complet d'una reserva:
 * checklist, comunicacions, timeline, client, portal, rendibilitat, inventari, pagaments, documents.
 *
 * Requereix el booking ja carregat (amb includes necessaris).
 */
export async function getBookingOperationalSnapshot(booking: {
  id: string;
  customerId: string | null;
  clientEmail: string;
  eventStartTime: string | null;
  eventEndTime: string | null;
  depositAmount: number;
  remainingAmount: number;
  reviewSubmittedAt: Date | null;
  postEventEmailSent: boolean | null;
  clientSurvey: unknown;
  postEventReport: unknown;
  clientFeedback: { sentAt: Date | null } | null;
  inventory: Array<{
    itemId: string;
    quantity: number | null;
    item: { purchasePrice: number | null; expectedLifeHours: number | null };
  }>;
  proposals: Array<{ contractSignedAt: Date | null }>;
  invoices: Array<{ total: number | null }>;
}): Promise<BookingOperationalSnapshot> {
  const [
    checklist,
    timeline,
    customer,
    portalAccess,
    profitabilityConfig,
    marginTargetSetting,
    inventoryCost,
  ] = await Promise.all([
    safeFetch(() => getBookingChecklist(booking.id), [], 'checklist'),
    safeFetch(() => fetchCanonicalEventsForBooking(booking.id, 30), [], 'timeline'),
    safeFetch(() => fetchCustomerContext(booking.customerId, booking.clientEmail), null, 'customer'),
    safeFetch(() => getActivePortalAccessForBooking(booking.id), null, 'portalAccess'),
    safeFetch(() => getProfitabilityConfig(), {} as ProfitabilityConfig, 'profitabilityConfig'),
    safeFetch(
      () => prisma.setting.findUnique({ where: { key: 'pricing.pack.marginTargetPct' } }),
      null,
      'marginTarget',
    ),
    safeFetch(
      () => computeInventoryCost(booking.inventory, booking.eventStartTime, booking.eventEndTime),
      { totalCost: 0, hours: 0, remainingHoursAvg: null, remainingHoursMin: null },
      'inventoryCost',
    ),
  ]);

  const commStatuses = {
    PAYMENT: deriveFlowStatusFromTimeline(timeline, 'PAYMENT'),
    POST_EVENT: deriveFlowStatusFromTimeline(timeline, 'POST_EVENT'),
    GENERAL: deriveFlowStatusFromTimeline(timeline, 'GENERAL'),
  } as Record<FlowKey, CommFlowStatus>;

  const recentCommRows = buildRecentCommRowsFromTimeline(timeline) as CommRow[];

  const marginTargetRaw = Number(marginTargetSetting?.value);
  const targetMarginPct = Number.isFinite(marginTargetRaw)
    ? marginTargetRaw > 1 ? marginTargetRaw : marginTargetRaw * 100
    : 35;

  return {
    checklist,
    commStatuses,
    recentCommRows,
    reviewFlowStatus: deriveReviewFlowStatus(booking),
    internalPostEventStatus: deriveInternalPostEventStatus(booking),
    timeline,
    customer,
    portalAccess,
    profitabilityConfig,
    targetMarginPct,
    inventoryCost,
    payment: {
      invoiceCount: booking.invoices.length,
      totalInvoiced: booking.invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0),
      depositAmount: Number(booking.depositAmount),
      remainingAmount: Number(booking.remainingAmount),
    },
    documents: {
      proposalCount: booking.proposals.length,
      hasSignedContract: booking.proposals.some((p) => !!p.contractSignedAt),
      invoiceCount: booking.invoices.length,
    },
  };
}
