import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockScoreLead, mockEstimateAmount } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    booking: { aggregate: vi.fn(), findMany: vi.fn() },
    customer: { count: vi.fn(), aggregate: vi.fn() },
  },
  mockScoreLead: vi.fn(),
  mockEstimateAmount: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/commercialScoring', () => ({
  scoreLead: mockScoreLead,
  estimateLeadAmount: mockEstimateAmount,
}));

import { buildExecutiveReport, type ExecutiveReport } from '@/lib/services/executiveReportService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.groupBy.mockResolvedValue([
    { status: 'NEW', _count: 5 },
    { status: 'CONTACTED', _count: 3 },
    { status: 'WON', _count: 2 },
  ]);
  mockPrisma.booking.aggregate.mockResolvedValue({ _sum: { total: 15000 }, _count: 10 });
  // 3 crides consecutives a lead.findMany a buildExecutiveReport:
  //   1) openLeads — leads oberts per scoring
  //   2) monthlyLeads (groupBy) — NO usa findMany sinó groupBy, queda per sota
  //   3) lostLeads — Canvi #366, finestra 90 dies
  // mockResolvedValue aplica el mateix []per defecte a totes les crides
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.lead.count.mockResolvedValue(1);
  mockPrisma.customer.count.mockResolvedValue(50);
  mockPrisma.customer.aggregate.mockResolvedValue({ _avg: { totalEvents: 1.5 } });
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockScoreLead.mockReturnValue({ score: 60, band: 'WARM', probability: 0.4, reasons: [], riskFlags: [] });
  mockEstimateAmount.mockReturnValue(1500);
});

describe('buildExecutiveReport', () => {
  it('retorna estructura completa', async () => {
    const report = await buildExecutiveReport();

    expect(report.generatedAt).toBeDefined();
    expect(report.period.monthStart).toBeDefined();
    expect(report.period.quarterStart).toBeDefined();
    expect(report.headline.customers).toBe(50);
    expect(report.headline.bookingsClosed).toBe(10);
    expect(report.headline.revenueClosed).toBe(15000);
    expect(report.headline.slaBroken).toBe(1);
  });

  it('desglossa funnel per status', async () => {
    const report = await buildExecutiveReport();

    expect(report.funnel.NEW).toBe(5);
    expect(report.funnel.CONTACTED).toBe(3);
    expect(report.funnel.WON).toBe(2);
    expect(report.funnel.QUOTE_SENT).toBe(0);
    expect(report.funnel.NEGOTIATING).toBe(0);
    expect(report.funnel.LOST).toBe(0);
  });

  it('calcula pipeline i forecast amb leads oberts', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'l1', name: 'Lead1', status: 'NEW', source: 'web', assignedTo: null, createdAt: new Date(), updatedAt: new Date(), eventDate: null, budget: '2000', phone: null, eventLocation: null, guestCount: null, interestedPackId: null, eventType: 'WEDDING' },
      { id: 'l2', name: 'Lead2', status: 'CONTACTED', source: 'referral', assignedTo: null, createdAt: new Date(), updatedAt: new Date(), eventDate: null, budget: null, phone: null, eventLocation: null, guestCount: null, interestedPackId: null, eventType: 'OTHER' },
    ]);

    const report = await buildExecutiveReport();

    expect(report.headline.openLeads).toBe(2);
    expect(report.headline.pipelineRaw).toBe(3000); // 1500 * 2
    expect(report.headline.forecastWeighted).toBe(1200); // 1500 * 0.4 * 2
  });

  it('ordena topRiskLeads per score ascendent', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { id: 'l1', name: 'Hot', status: 'NEGOTIATING', source: 'web', assignedTo: null, createdAt: new Date(), updatedAt: new Date(), eventDate: null, budget: null, phone: null, eventLocation: null, guestCount: null, interestedPackId: null, eventType: null },
      { id: 'l2', name: 'Cold', status: 'NEW', source: 'web', assignedTo: null, createdAt: new Date(), updatedAt: new Date(), eventDate: null, budget: null, phone: null, eventLocation: null, guestCount: null, interestedPackId: null, eventType: null },
    ]);
    mockScoreLead
      .mockReturnValueOnce({ score: 80, probability: 0.7, reasons: [], riskFlags: [] })
      .mockReturnValueOnce({ score: 20, probability: 0.1, reasons: [], riskFlags: [] });

    const report = await buildExecutiveReport();

    expect(report.topRiskLeads[0].name).toBe('Cold');
    expect(report.topRiskLeads[1].name).toBe('Hot');
  });
});

describe('buildExecutiveReport — lossSummary (Canvi #366)', () => {
  it('inclou lossSummary amb estructura buida quan no hi ha leads LOST', async () => {
    const report = await buildExecutiveReport();

    expect(report.lossSummary).toBeDefined();
    expect(report.lossSummary.total).toBe(0);
    expect(report.lossSummary.byReason).toEqual([]);
    expect(report.lossSummary.topReason).toBeNull();
  });

  it('agrega lossSummary amb dades reals de leads LOST', async () => {
    const lostAt = new Date('2026-04-10T12:00:00.000Z');
    // buildExecutiveReport fa 2 crides consecutives a lead.findMany:
    //   1) openLeads (scoring)
    //   2) lostLeads (loss summary, Canvi #367)
    mockPrisma.lead.findMany
      .mockResolvedValueOnce([]) // openLeads
      .mockResolvedValueOnce([
        { id: 'lost1', name: 'Perdut 1', lostReason: 'PRICE_TOO_HIGH', lostAt, eventType: 'WEDDING', source: 'WEBSITE', budget: null, eventLocation: null },
        { id: 'lost2', name: 'Perdut 2', lostReason: 'PRICE_TOO_HIGH', lostAt, eventType: 'WEDDING', source: 'WEBSITE', budget: null, eventLocation: null },
        { id: 'lost3', name: 'Perdut 3', lostReason: 'NO_RESPONSE', lostAt, eventType: 'BIRTHDAY', source: 'INSTAGRAM', budget: null, eventLocation: null },
      ]); // lostLeads

    const report = await buildExecutiveReport();

    expect(report.lossSummary.total).toBe(3);
    expect(report.lossSummary.topReason?.reason).toBe('PRICE_TOO_HIGH');
    expect(report.lossSummary.topReason?.count).toBe(2);
    expect(report.lossSummary.byReason.map((r) => r.key)).toEqual(['PRICE_TOO_HIGH', 'NO_RESPONSE']);
  });
});
