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

import { buildExecutiveReport, exportExecutiveReportCsv, type ExecutiveReport } from '@/lib/services/executiveReportService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.groupBy.mockResolvedValue([
    { status: 'NEW', _count: 5 },
    { status: 'CONTACTED', _count: 3 },
    { status: 'WON', _count: 2 },
  ]);
  mockPrisma.booking.aggregate.mockResolvedValue({ _sum: { total: 15000 }, _count: 10 });
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

// ── Pure: exportExecutiveReportCsv ─────────────────────────────────────────

const sampleReport: ExecutiveReport = {
  generatedAt: '2026-06-15T10:00:00.000Z',
  period: { monthStart: '2026-06-01T00:00:00.000Z', quarterStart: '2026-04-01T00:00:00.000Z' },
  headline: {
    customers: 120,
    openLeads: 35,
    bookingsClosed: 22,
    revenueClosed: 45000,
    pipelineRaw: 80000,
    forecastWeighted: 32000,
    slaBroken: 3,
  },
  funnel: { NEW: 10, CONTACTED: 8, QUOTE_SENT: 7, NEGOTIATING: 5, WON: 3, LOST: 2 },
  conversionBySource: [
    { source: 'web', total: 20, won: 5, winRate: 0.25, avgRevenue: 2000 },
    { source: 'referral', total: 10, won: 4, winRate: 0.4, avgRevenue: 3000 },
  ],
  recurrence: { totalCustomers: 120, returning: 30, returningRate: 0.25, avgEventsPerCustomer: 1.8 },
  margin: { totalRevenue: 45000, totalCost: 12000, grossMargin: 33000, marginRate: 0.7333 },
  monthlyTrend: [
    { month: '2026-01', leads: 15, bookings: 4, revenue: 8000 },
    { month: '2026-02', leads: 20, bookings: 6, revenue: 12000 },
  ],
  topRiskLeads: [
    { id: 'l1', name: 'Risk Lead', status: 'NEW', assignedTo: null, source: 'web', score: 15, probability: 0.05, weightedAmount: 75 },
  ],
};

describe('exportExecutiveReportCsv', () => {
  it('genera CSV vàlid amb totes les seccions', () => {
    const csv = exportExecutiveReportCsv(sampleReport);
    const lines = csv.split('\n');

    expect(lines[0]).toContain('Informe executiu');
    expect(csv).toContain('INDICADORS PRINCIPALS');
    expect(csv).toContain('EMBUT COMERCIAL');
    expect(csv).toContain('CONVERSIÓ PER ORIGEN');
    expect(csv).toContain('RECURRÈNCIA');
    expect(csv).toContain('MARGE');
    expect(csv).toContain('TENDÈNCIA MENSUAL');
    expect(csv).toContain('LEADS EN RISC');
  });

  it('inclou KPIs principals correctes', () => {
    const csv = exportExecutiveReportCsv(sampleReport);

    expect(csv).toContain('Clients,120');
    expect(csv).toContain('Leads oberts,35');
    expect(csv).toContain('Reserves tancades,22');
    expect(csv).toContain('45000.00');
    expect(csv).toContain('SLA trencats,3');
  });

  it('inclou dades de funnel', () => {
    const csv = exportExecutiveReportCsv(sampleReport);

    expect(csv).toContain('NEW,10');
    expect(csv).toContain('CONTACTED,8');
    expect(csv).toContain('QUOTE_SENT,7');
    expect(csv).toContain('WON,3');
    expect(csv).toContain('LOST,2');
  });

  it('inclou conversió per origen amb percentatges', () => {
    const csv = exportExecutiveReportCsv(sampleReport);

    expect(csv).toContain('web,20,5,25.0,2000.00');
    expect(csv).toContain('referral,10,4,40.0,3000.00');
  });

  it('inclou tendència mensual', () => {
    const csv = exportExecutiveReportCsv(sampleReport);

    expect(csv).toContain('2026-01,15,4,8000.00');
    expect(csv).toContain('2026-02,20,6,12000.00');
  });

  it('inclou leads en risc', () => {
    const csv = exportExecutiveReportCsv(sampleReport);

    expect(csv).toContain('Risk Lead');
    expect(csv).toContain('75.00');
  });

  it('escapa comes i cometes al CSV', () => {
    const reportWithComma: ExecutiveReport = {
      ...sampleReport,
      topRiskLeads: [
        { id: 'l1', name: 'Lead, amb coma', status: 'NEW', assignedTo: 'Joan "Jordi"', source: 'web', score: 15, probability: 0.05, weightedAmount: 75 },
      ],
    };

    const csv = exportExecutiveReportCsv(reportWithComma);

    expect(csv).toContain('"Lead, amb coma"');
    expect(csv).toContain('"Joan ""Jordi"""');
  });

  it('inclou marge brut i taxa', () => {
    const csv = exportExecutiveReportCsv(sampleReport);

    expect(csv).toContain('Marge brut');
    expect(csv).toContain('33000.00');
    expect(csv).toContain('73.3');
  });

  it('inclou recurrència', () => {
    const csv = exportExecutiveReportCsv(sampleReport);

    expect(csv).toContain('Clients recurrents,30');
    expect(csv).toContain('25.0');
    expect(csv).toContain('1.80');
  });
});
