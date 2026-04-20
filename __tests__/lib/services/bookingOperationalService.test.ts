import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mocks hoisted ─────────────────────────────────────────────────────

const { mockPrisma, mockGetBookingChecklist, mockGetActivePortalAccess, mockGetProfitabilityConfig, mockFetchCanonicalEventsForBooking } = vi.hoisted(() => ({
  mockPrisma: {
    adminLog: { findMany: vi.fn() },
    customer: { findUnique: vi.fn(), findFirst: vi.fn() },
    setting: { findUnique: vi.fn() },
    inventoryUsage: { groupBy: vi.fn() },
  },
  mockGetBookingChecklist: vi.fn(),
  mockGetActivePortalAccess: vi.fn(),
  mockGetProfitabilityConfig: vi.fn(),
  mockFetchCanonicalEventsForBooking: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/services/bookingChecklistService', () => ({
  getBookingChecklist: mockGetBookingChecklist,
}));
vi.mock('@/lib/services/clientPortalAccess', () => ({
  getActivePortalAccessForBooking: mockGetActivePortalAccess,
}));
vi.mock('@/lib/services/profitabilityService', () => ({
  getProfitabilityConfig: mockGetProfitabilityConfig,
}));
vi.mock('@/lib/services/timelineQueryService', () => ({
  fetchCanonicalEventsForBooking: mockFetchCanonicalEventsForBooking,
}));

import { getBookingOperationalSnapshot } from '@/lib/services/bookingOperationalService';

// ─── Helpers ────────────────────────────────────────────────────────────

function makeBookingInput(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    customerId: 'cust-1',
    clientEmail: 'test@example.com',
    eventStartTime: '18:00',
    eventEndTime: '23:00',
    depositAmount: 500,
    remainingAmount: 1500,
    reviewSubmittedAt: null as Date | null,
    postEventEmailSent: null as boolean | null,
    clientSurvey: null,
    postEventReport: null,
    clientFeedback: null as { sentAt: Date | null } | null,
    inventory: [] as Array<{
      itemId: string;
      quantity: number | null;
      item: { purchasePrice: number | null; expectedLifeHours: number | null };
    }>,
    proposals: [] as Array<{ contractSignedAt: Date | null }>,
    invoices: [] as Array<{ total: number | null }>,
    ...overrides,
  };
}

const defaultProfConfig = {
  packCostRatio: 0.3,
  extraCostRatio: 0.25,
  extraHourCostRatio: 0.2,
  fixedOperationalCost: 50,
  channelCac: {},
};

// ─── Setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockGetBookingChecklist.mockResolvedValue([
    { id: 'c1', label: 'Item 1', checked: false },
  ]);
  mockPrisma.adminLog.findMany.mockResolvedValue([]);
  mockFetchCanonicalEventsForBooking.mockResolvedValue([]);
  mockPrisma.customer.findUnique.mockResolvedValue({
    id: 'cust-1', totalEvents: 5, totalSpent: 10000, lastEventDate: new Date('2026-03-01'),
  });
  mockPrisma.customer.findFirst.mockResolvedValue(null);
  mockGetActivePortalAccess.mockResolvedValue(null);
  mockGetProfitabilityConfig.mockResolvedValue(defaultProfConfig);
  mockPrisma.setting.findUnique.mockResolvedValue({ value: '35' });
  mockPrisma.inventoryUsage.groupBy.mockResolvedValue([]);
});

// ─── Tests ──────────────────────────────────────────────────────────────

describe('getBookingOperationalSnapshot', () => {
  it('retorna snapshot complet amb totes les seccions', async () => {
    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(result.checklist).toHaveLength(1);
    expect(result.commStatuses.PAYMENT.state).toBe('FALTA_ENVIAR');
    expect(result.commStatuses.POST_EVENT.state).toBe('FALTA_ENVIAR');
    expect(result.commStatuses.GENERAL.state).toBe('FALTA_ENVIAR');
    expect(result.reviewFlowStatus).toBe('FALTA_ENVIAR');
    expect(result.internalPostEventStatus).toBe('PENDIENTE');
    expect(result.timeline).toEqual([]);
    expect(result.customer).not.toBeNull();
    expect(result.customer!.id).toBe('cust-1');
    expect(result.portalAccess).toBeNull();
    expect(result.profitabilityConfig).toEqual(defaultProfConfig);
    expect(result.targetMarginPct).toBe(35);
    expect(result.inventoryCost.totalCost).toBe(0);
    expect(result.payment.depositAmount).toBe(500);
    expect(result.payment.remainingAmount).toBe(1500);
    expect(result.documents.proposalCount).toBe(0);
    expect(result.documents.hasSignedContract).toBe(false);
  });

  it('delega checklist a getBookingChecklist', async () => {
    await getBookingOperationalSnapshot(makeBookingInput());
    expect(mockGetBookingChecklist).toHaveBeenCalledWith('booking-1');
  });

  it('delega timeline a fetchCanonicalEventsForBooking', async () => {
    const events = [{ id: 'ev1', kind: 'system', source: 'adminLog', occurredAt: new Date() }];
    mockFetchCanonicalEventsForBooking.mockResolvedValue(events);

    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(mockFetchCanonicalEventsForBooking).toHaveBeenCalledWith('booking-1', 30);
    expect(result.timeline).toEqual(events);
  });

  // ─── commStatuses ───────────────────────────────────────────────────

  it('deriva commStatuses de commLogs', async () => {
    const now = new Date();
    mockPrisma.adminLog.findMany.mockResolvedValue([
      { id: 'log-1', action: 'COMM_SENT', createdAt: now, details: { flow: 'PAYMENT', channel: 'email' } },
      { id: 'log-2', action: 'COMM_RESPONDED', createdAt: now, details: { flow: 'PAYMENT' } },
    ]);

    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(result.commStatuses.PAYMENT.state).toBe('RESPONDIDO');
    expect(result.commStatuses.POST_EVENT.state).toBe('FALTA_ENVIAR');
  });

  it('genera recentCommRows a partir de commLogs', async () => {
    const now = new Date();
    mockPrisma.adminLog.findMany.mockResolvedValue([
      { id: 'log-1', action: 'COMM_SENT', createdAt: now, details: { flow: 'PAYMENT', channel: 'email' } },
      { id: 'log-2', action: 'COMM_RESPONDED', createdAt: now, details: { flow: 'POST_EVENT' } },
    ]);

    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(result.recentCommRows).toHaveLength(2);
    expect(result.recentCommRows[0]).toEqual({
      id: 'log-1',
      createdAt: now,
      action: 'COMM_SENT',
      flow: 'PAYMENT',
      channel: 'email',
    });
    expect(result.recentCommRows[1].channel).toBe('-');
  });

  // ─── reviewFlowStatus ──────────────────────────────────────────────

  it('reviewFlowStatus = RESPONDIDO si reviewSubmittedAt', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({ reviewSubmittedAt: new Date() }),
    );
    expect(result.reviewFlowStatus).toBe('RESPONDIDO');
  });

  it('reviewFlowStatus = RESPONDIDO si clientSurvey present', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({ clientSurvey: { id: 's1' } }),
    );
    expect(result.reviewFlowStatus).toBe('RESPONDIDO');
  });

  it('reviewFlowStatus = ENVIADO si postEventEmailSent', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({ postEventEmailSent: true }),
    );
    expect(result.reviewFlowStatus).toBe('ENVIADO');
  });

  // ─── internalPostEventStatus ──────────────────────────────────────

  it('internalPostEventStatus = COMPLETO si report + feedback.sentAt', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({
        postEventReport: { id: 'r1' },
        clientFeedback: { sentAt: new Date() },
      }),
    );
    expect(result.internalPostEventStatus).toBe('COMPLETO');
  });

  it('internalPostEventStatus = EN_PROGRESO si només report', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({ postEventReport: { id: 'r1' } }),
    );
    expect(result.internalPostEventStatus).toBe('EN_PROGRESO');
  });

  it('internalPostEventStatus = EN_PROGRESO si només feedback.sentAt', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({ clientFeedback: { sentAt: new Date() } }),
    );
    expect(result.internalPostEventStatus).toBe('EN_PROGRESO');
  });

  // ─── customer context ─────────────────────────────────────────────

  it('busca customer per customerId si existeix', async () => {
    await getBookingOperationalSnapshot(makeBookingInput());
    expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cust-1' } }),
    );
    expect(mockPrisma.customer.findFirst).not.toHaveBeenCalled();
  });

  it('busca customer per email si no hi ha customerId', async () => {
    mockPrisma.customer.findFirst.mockResolvedValue({ id: 'cust-email', totalEvents: 1, totalSpent: 500, lastEventDate: null });

    const result = await getBookingOperationalSnapshot(
      makeBookingInput({ customerId: null }),
    );

    expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { emailNormalized: 'test@example.com' },
      }),
    );
    expect(result.customer!.id).toBe('cust-email');
  });

  // ─── targetMarginPct ──────────────────────────────────────────────

  it('targetMarginPct default 35 si no hi ha setting', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);

    const result = await getBookingOperationalSnapshot(makeBookingInput());
    expect(result.targetMarginPct).toBe(35);
  });

  it('targetMarginPct normalitza valors < 1 com a percentatge', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: '0.40' });

    const result = await getBookingOperationalSnapshot(makeBookingInput());
    expect(result.targetMarginPct).toBe(40);
  });

  it('targetMarginPct usa directament valors > 1', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: '50' });

    const result = await getBookingOperationalSnapshot(makeBookingInput());
    expect(result.targetMarginPct).toBe(50);
  });

  // ─── inventory cost ───────────────────────────────────────────────

  it('calcula inventoryCost amb items assignats', async () => {
    mockPrisma.inventoryUsage.groupBy.mockResolvedValue([
      { itemId: 'item-1', _sum: { hoursUsed: 100 } },
    ]);

    const result = await getBookingOperationalSnapshot(
      makeBookingInput({
        inventory: [
          {
            itemId: 'item-1',
            quantity: 1,
            item: { purchasePrice: 2000, expectedLifeHours: 2000 },
          },
        ],
      }),
    );

    // costPerHour = 2000/2000 = 1€/h, duration = 5h (18:00-23:00), cost = 5€
    expect(result.inventoryCost.totalCost).toBe(5);
    expect(result.inventoryCost.hours).toBe(5);
    expect(result.inventoryCost.remainingHoursAvg).toBe(1900); // 2000 - 100
    expect(result.inventoryCost.remainingHoursMin).toBe(1900);
  });

  it('inventoryCost retorna nulls sense inventari', async () => {
    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(result.inventoryCost.totalCost).toBe(0);
    expect(result.inventoryCost.remainingHoursAvg).toBeNull();
    expect(result.inventoryCost.remainingHoursMin).toBeNull();
  });

  // ─── payment / documents ──────────────────────────────────────────

  it('calcula payment summary des de invoices', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({
        invoices: [{ total: 800 }, { total: 700 }],
      }),
    );

    expect(result.payment.invoiceCount).toBe(2);
    expect(result.payment.totalInvoiced).toBe(1500);
  });

  it('calcula documents summary', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({
        proposals: [
          { contractSignedAt: null },
          { contractSignedAt: new Date() },
        ],
        invoices: [{ total: 500 }],
      }),
    );

    expect(result.documents.proposalCount).toBe(2);
    expect(result.documents.hasSignedContract).toBe(true);
    expect(result.documents.invoiceCount).toBe(1);
  });

  it('hasSignedContract = false si cap proposta signada', async () => {
    const result = await getBookingOperationalSnapshot(
      makeBookingInput({
        proposals: [{ contractSignedAt: null }],
      }),
    );
    expect(result.documents.hasSignedContract).toBe(false);
  });

  // ─── safeFetch resilience ─────────────────────────────────────────

  it('snapshot funciona si checklist falla (safeFetch)', async () => {
    mockGetBookingChecklist.mockRejectedValue(new Error('DB timeout'));

    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(result.checklist).toEqual([]);
  });

  it('snapshot funciona si customer query falla', async () => {
    mockPrisma.customer.findUnique.mockRejectedValue(new Error('connection lost'));

    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(result.customer).toBeNull();
  });

  it('snapshot funciona si timeline falla', async () => {
    mockFetchCanonicalEventsForBooking.mockRejectedValue(new Error('oops'));

    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(result.timeline).toEqual([]);
  });

  it('snapshot funciona si portalAccess falla', async () => {
    mockGetActivePortalAccess.mockRejectedValue(new Error('fail'));

    const result = await getBookingOperationalSnapshot(makeBookingInput());

    expect(result.portalAccess).toBeNull();
  });
});
