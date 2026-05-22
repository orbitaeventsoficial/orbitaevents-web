import { describe, it, expect } from 'vitest';
import {
  generateReportingInsights,
  type ReportingInsight,
} from '@/lib/services/reportingInsightsService';
import type { ExecutiveReport } from '@/lib/services/executiveReportService';

const BASE_LOSS_SUMMARY = {
  total: 0,
  uncategorized: 0,
  autoTotal: 0,
  commercialTotal: 0,
  byReason: [],
  byEventType: [],
  bySource: [],
  byMonth: [],
  topReason: null,
};

const BASE_REPORT: ExecutiveReport = {
  generatedAt: '2026-05-11T00:00:00.000Z',
  period: { monthStart: '2026-05-01', quarterStart: '2026-04-01' },
  headline: {
    customers: 20,
    openLeads: 10,
    bookingsClosed: 5,
    revenueClosed: 15000,
    pipelineRaw: 30000,
    forecastWeighted: 18000,
    slaBroken: 0,
  },
  funnel: { NEW: 5, CONTACTED: 3, QUOTE_SENT: 2, NEGOTIATING: 1, WON: 5, LOST: 2 },
  conversionBySource: [],
  recurrence: { totalCustomers: 20, returning: 8, returningRate: 0.4, avgEventsPerCustomer: 1.5 },
  margin: { totalRevenue: 15000, totalCost: 5000, grossMargin: 10000, marginRate: 0.667 },
  monthlyTrend: [
    { month: '2025-12', leads: 5, bookings: 2, revenue: 6000 },
    { month: '2026-01', leads: 6, bookings: 3, revenue: 7000 },
    { month: '2026-02', leads: 7, bookings: 3, revenue: 8000 },
  ],
  topRiskLeads: [],
  lossSummary: BASE_LOSS_SUMMARY,
};

describe('generateReportingInsights', () => {
  it('returns empty array when everything is healthy', () => {
    const result = generateReportingInsights(BASE_REPORT, { emailOpenRate: 0.5, emailReplyRate: 0.15 });
    expect(result).toEqual([]);
  });

  it('generates critical insight for broken SLAs', () => {
    const report = { ...BASE_REPORT, headline: { ...BASE_REPORT.headline, slaBroken: 3 } };
    const result = generateReportingInsights(report);
    const sla = result.find((i) => i.priority === 'critical');
    expect(sla).toBeDefined();
    expect(sla!.area).toBe('Operatiu');
    expect(sla!.headline).toContain('3 SLA');
    expect(sla!.href).toBe('/admin/leads');
  });

  it('puts critical insight before warning insights', () => {
    const report = {
      ...BASE_REPORT,
      headline: { ...BASE_REPORT.headline, slaBroken: 2 },
      margin: { ...BASE_REPORT.margin, marginRate: 0.4, totalRevenue: 10000 },
    };
    const result = generateReportingInsights(report);
    expect(result[0].priority).toBe('critical');
    expect(result[1].priority).toBe('warning');
  });

  it('generates warning for empty pipeline', () => {
    const report = {
      ...BASE_REPORT,
      headline: { ...BASE_REPORT.headline, openLeads: 0, pipelineRaw: 0 },
    };
    const result = generateReportingInsights(report);
    const pipeline = result.find((i) => i.area === 'Pipeline');
    expect(pipeline).toBeDefined();
    expect(pipeline!.priority).toBe('warning');
    expect(pipeline!.headline).toContain('buit');
  });

  it('does not generate pipeline warning when pipeline has value', () => {
    const result = generateReportingInsights(BASE_REPORT);
    const pipeline = result.find((i) => i.area === 'Pipeline');
    expect(pipeline).toBeUndefined();
  });

  it('generates warning for low margin', () => {
    const report = {
      ...BASE_REPORT,
      margin: { totalRevenue: 10000, totalCost: 5000, grossMargin: 5000, marginRate: 0.5 },
    };
    const result = generateReportingInsights(report);
    const margin = result.find((i) => i.area === 'Finances');
    expect(margin).toBeDefined();
    expect(margin!.headline).toContain('50.0%');
    expect(margin!.href).toBe('/admin/pricing');
  });

  it('does not generate margin warning when revenue is zero', () => {
    const report = {
      ...BASE_REPORT,
      margin: { totalRevenue: 0, totalCost: 0, grossMargin: 0, marginRate: 0 },
    };
    const result = generateReportingInsights(report);
    const margin = result.find((i) => i.area === 'Finances');
    expect(margin).toBeUndefined();
  });

  it('generates warning for low recurrence', () => {
    const report = {
      ...BASE_REPORT,
      recurrence: { totalCustomers: 10, returning: 2, returningRate: 0.2, avgEventsPerCustomer: 1.2 },
    };
    const result = generateReportingInsights(report);
    const rec = result.find((i) => i.area === 'Recurrència');
    expect(rec).toBeDefined();
    expect(rec!.headline).toContain('20.0%');
    expect(rec!.href).toBe('/admin/clientes');
  });

  it('does not generate recurrence warning for small customer base', () => {
    const report = {
      ...BASE_REPORT,
      recurrence: { totalCustomers: 3, returning: 0, returningRate: 0, avgEventsPerCustomer: 1 },
    };
    const result = generateReportingInsights(report);
    expect(result.find((i) => i.area === 'Recurrència')).toBeUndefined();
  });

  it('generates warning for 3-month revenue decline', () => {
    const report = {
      ...BASE_REPORT,
      monthlyTrend: [
        { month: '2025-12', leads: 5, bookings: 3, revenue: 9000 },
        { month: '2026-01', leads: 4, bookings: 2, revenue: 7000 },
        { month: '2026-02', leads: 3, bookings: 1, revenue: 5000 },
      ],
    };
    const result = generateReportingInsights(report);
    const trend = result.find((i) => i.area === 'Tendència');
    expect(trend).toBeDefined();
    expect(trend!.headline).toContain('caiguda');
    expect(trend!.detail).toContain('2025-12');
  });

  it('does not generate trend warning without consistent decline', () => {
    const result = generateReportingInsights(BASE_REPORT);
    expect(result.find((i) => i.area === 'Tendència')).toBeUndefined();
  });

  it('generates funnel stalled warning when contacts exceed threshold with no quotes', () => {
    const report = {
      ...BASE_REPORT,
      funnel: { NEW: 3, CONTACTED: 5, QUOTE_SENT: 0, NEGOTIATING: 0, WON: 2, LOST: 1 },
    };
    const result = generateReportingInsights(report);
    const funnel = result.find((i) => i.area === 'Funnel');
    expect(funnel).toBeDefined();
    expect(funnel!.headline).toContain('5 leads contactats');
  });

  it('does not generate funnel warning when quotes are being sent', () => {
    const result = generateReportingInsights(BASE_REPORT);
    expect(result.find((i) => i.area === 'Funnel')).toBeUndefined();
  });

  it('generates warning for risk leads when no SLA broken', () => {
    const report = {
      ...BASE_REPORT,
      topRiskLeads: [
        { id: '1', name: 'Lead A', status: 'CONTACTED', assignedTo: null, source: 'web', score: 20, probability: 0.1, weightedAmount: 1000 },
      ],
    };
    const result = generateReportingInsights(report);
    const risk = result.find((i) => i.area === 'Risc');
    expect(risk).toBeDefined();
    expect(risk!.headline).toContain('1 leads en risc');
    expect(risk!.detail).toContain('Lead A');
  });

  it('suppresses risk leads insight when SLA broken is present', () => {
    const report = {
      ...BASE_REPORT,
      headline: { ...BASE_REPORT.headline, slaBroken: 2 },
      topRiskLeads: [
        { id: '1', name: 'Lead A', status: 'CONTACTED', assignedTo: null, source: 'web', score: 20, probability: 0.1, weightedAmount: 1000 },
      ],
    };
    const result = generateReportingInsights(report);
    expect(result.find((i) => i.area === 'Risc')).toBeUndefined();
  });

  it('generates warning for weak email open rate', () => {
    const result = generateReportingInsights(BASE_REPORT, { emailOpenRate: 0.25, emailReplyRate: 0.1 });
    const email = result.find((i) => i.area === 'Email');
    expect(email).toBeDefined();
    expect(email!.detail).toContain('25.0%');
  });

  it('generates warning for weak email reply rate', () => {
    const result = generateReportingInsights(BASE_REPORT, { emailOpenRate: 0.5, emailReplyRate: 0.05 });
    const email = result.find((i) => i.area === 'Email');
    expect(email).toBeDefined();
    expect(email!.detail).toContain('5.0%');
  });

  it('generates positive insight for strong conversion source', () => {
    const report = {
      ...BASE_REPORT,
      conversionBySource: [
        { source: 'Instagram', total: 10, won: 6, winRate: 0.6, avgRevenue: 3000 },
        { source: 'Web', total: 5, won: 1, winRate: 0.2, avgRevenue: 2000 },
      ],
    };
    const result = generateReportingInsights(report, { emailOpenRate: 0.5, emailReplyRate: 0.15 });
    const positive = result.find((i) => i.priority === 'positive');
    expect(positive).toBeDefined();
    expect(positive!.area).toBe('Conversió');
    expect(positive!.headline).toContain('Instagram');
    expect(positive!.headline).toContain('60.0%');
  });

  it('does not generate positive insight if best source below threshold', () => {
    const report = {
      ...BASE_REPORT,
      conversionBySource: [
        { source: 'Web', total: 10, won: 3, winRate: 0.3, avgRevenue: 2000 },
      ],
    };
    const result = generateReportingInsights(report, { emailOpenRate: 0.5, emailReplyRate: 0.15 });
    expect(result.find((i) => i.priority === 'positive')).toBeUndefined();
  });

  it('does not pick best source with fewer than 3 leads', () => {
    const report = {
      ...BASE_REPORT,
      conversionBySource: [
        { source: 'Referral', total: 2, won: 2, winRate: 1.0, avgRevenue: 5000 },
      ],
    };
    const result = generateReportingInsights(report, { emailOpenRate: 0.5, emailReplyRate: 0.15 });
    expect(result.find((i) => i.area === 'Conversió')).toBeUndefined();
  });
});
