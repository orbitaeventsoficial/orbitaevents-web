import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockScoreLead, mockEstimateAmount } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    booking: { aggregate: vi.fn() },
    customer: { count: vi.fn() },
  },
  mockScoreLead: vi.fn(),
  mockEstimateAmount: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/commercialScoring', () => ({
  scoreLead: mockScoreLead,
  estimateLeadAmount: mockEstimateAmount,
}));

import { buildExecutiveReport } from '@/lib/services/executiveReportService';

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
