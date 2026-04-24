import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logo-base64', () => ({
  ORBITA_LOGO_BASE64: 'data:image/png;base64,fake',
}));

import { exportExecutiveReportPdf } from '@/lib/services/executiveReportPdfService';
import type { ExecutiveReport } from '@/lib/services/executiveReportService';

function makeReport(overrides: Partial<ExecutiveReport> = {}): ExecutiveReport {
  return {
    generatedAt: '2026-04-17T10:00:00Z',
    period: { monthStart: '2026-04-01T00:00:00Z', quarterStart: '2026-04-01T00:00:00Z' },
    headline: {
      customers: 42,
      openLeads: 15,
      bookingsClosed: 8,
      revenueClosed: 24500,
      pipelineRaw: 60000,
      forecastWeighted: 32000,
      slaBroken: 2,
    },
    funnel: { NEW: 5, CONTACTED: 4, QUOTE_SENT: 3, NEGOTIATING: 2, WON: 8, LOST: 6 },
    conversionBySource: [
      { source: 'WEB', total: 20, won: 5, winRate: 0.25, avgRevenue: 3000 },
      { source: 'REFERRAL', total: 8, won: 3, winRate: 0.375, avgRevenue: 4000 },
    ],
    recurrence: { totalCustomers: 42, returning: 12, returningRate: 0.286, avgEventsPerCustomer: 1.8 },
    margin: { totalRevenue: 24500, totalCost: 8200, grossMargin: 16300, marginRate: 0.665 },
    monthlyTrend: [
      { month: '2025-11', leads: 10, bookings: 2, revenue: 5000 },
      { month: '2025-12', leads: 8, bookings: 1, revenue: 3000 },
      { month: '2026-01', leads: 12, bookings: 3, revenue: 7000 },
      { month: '2026-02', leads: 9, bookings: 2, revenue: 4500 },
      { month: '2026-03', leads: 14, bookings: 4, revenue: 9000 },
      { month: '2026-04', leads: 6, bookings: 1, revenue: 2500 },
    ],
    topRiskLeads: [
      { id: 'l1', name: 'Maria', status: 'CONTACTED', assignedTo: null, source: 'WEB', score: 25, probability: 0.3, weightedAmount: 900 },
      { id: 'l2', name: 'Jordi', status: 'NEW', assignedTo: 'Anna', source: 'REFERRAL', score: 15, probability: 0.15, weightedAmount: 450 },
    ],
    lossSummary: {
      total: 0,
      uncategorized: 0,
      autoTotal: 0,
      commercialTotal: 0,
      byReason: [],
      byEventType: [],
      bySource: [],
      byMonth: [],
      topReason: null,
    },
    ...overrides,
  };
}

describe('exportExecutiveReportPdf', () => {
  it('returns an ArrayBuffer with PDF magic bytes', async () => {
    const result = await exportExecutiveReportPdf(makeReport());

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBeGreaterThan(500);
    const header = new Uint8Array(result.slice(0, 5));
    // PDF starts with %PDF-
    expect(String.fromCharCode(...header)).toBe('%PDF-');
  });

  it('works with empty risk leads', async () => {
    const result = await exportExecutiveReportPdf(makeReport({ topRiskLeads: [] }));

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBeGreaterThan(500);
  });

  it('works with many risk leads (forces page break)', async () => {
    const manyLeads = Array.from({ length: 20 }, (_, i) => ({
      id: `l${i}`,
      name: `Lead ${i}`,
      status: 'NEW',
      assignedTo: null,
      source: 'WEB',
      score: 10 + i,
      probability: 0.1,
      weightedAmount: 300,
    }));

    const result = await exportExecutiveReportPdf(makeReport({ topRiskLeads: manyLeads }));

    expect(result).toBeInstanceOf(ArrayBuffer);
    const header = new Uint8Array(result.slice(0, 5));
    expect(String.fromCharCode(...header)).toBe('%PDF-');
  });

  it('handles zero values without errors', async () => {
    const result = await exportExecutiveReportPdf(makeReport({
      headline: {
        customers: 0, openLeads: 0, bookingsClosed: 0,
        revenueClosed: 0, pipelineRaw: 0, forecastWeighted: 0, slaBroken: 0,
      },
      conversionBySource: [],
      monthlyTrend: [],
      margin: { totalRevenue: 0, totalCost: 0, grossMargin: 0, marginRate: 0 },
    }));

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBeGreaterThan(100);
  });
});
