import { prisma } from '@/lib/prisma';
import { estimateLeadAmount, scoreLead } from '@/lib/services/commercialScoring';
import { computeLossSummary, type LossReportLead, type LossSummary } from '@/lib/services/leadLossAnalyticsService';

export type ConversionBySource = {
  source: string;
  total: number;
  won: number;
  winRate: number;
  avgRevenue: number;
};

export type MonthlyTrend = {
  month: string;
  leads: number;
  bookings: number;
  revenue: number;
};

export type ExecutiveReport = {
  generatedAt: string;
  period: {
    monthStart: string;
    quarterStart: string;
  };
  headline: {
    customers: number;
    openLeads: number;
    bookingsClosed: number;
    revenueClosed: number;
    pipelineRaw: number;
    forecastWeighted: number;
    slaBroken: number;
  };
  funnel: {
    NEW: number;
    CONTACTED: number;
    QUOTE_SENT: number;
    NEGOTIATING: number;
    WON: number;
    LOST: number;
  };
  conversionBySource: ConversionBySource[];
  recurrence: {
    totalCustomers: number;
    returning: number;
    returningRate: number;
    avgEventsPerCustomer: number;
  };
  margin: {
    totalRevenue: number;
    totalCost: number;
    grossMargin: number;
    marginRate: number;
  };
  monthlyTrend: MonthlyTrend[];
  topRiskLeads: Array<{
    id: string;
    name: string;
    status: string;
    assignedTo: string | null;
    source: string;
    score: number;
    probability: number;
    weightedAmount: number;
  }>;
  lossSummary: LossSummary;
};

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER — Prisma query
// ───────────────────────────────────────────────────────────────────────────

export async function buildExecutiveReport(): Promise<ExecutiveReport> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const lostLeadsSince = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    leadStats, bookingStats, openLeads, customers, slaBroken,
    leadsBySource, returningCustomers, avgEventsRaw,
    bookingsWithCost, monthlyLeads, monthlyBookings,
    lostLeadsRaw,
  ] = await Promise.all([
    prisma.lead.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.booking.aggregate({
      where: {
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.lead.findMany({
      where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } },
      select: {
        id: true,
        name: true,
        status: true,
        source: true,
        assignedTo: true,
        createdAt: true,
        updatedAt: true,
        eventDate: true,
        budget: true,
        phone: true,
        eventLocation: true,
        guestCount: true,
        interestedPackId: true,
        eventType: true,
      },
      take: 2000,
    }),
    prisma.customer.count(),
    prisma.lead.count({
      where: {
        status: 'NEW',
        createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    // Conversion by source
    prisma.lead.groupBy({
      by: ['source', 'status'],
      _count: true,
    }),
    // Recurrence
    prisma.customer.count({ where: { totalEvents: { gte: 2 } } }),
    prisma.customer.aggregate({ _avg: { totalEvents: true } }),
    // Margin (bookings with cost data)
    prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      select: { total: true, travelCost: true },
    }),
    // Monthly trend (last 6 months)
    prisma.lead.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: sixMonthsAgo } },
      _count: true,
    }).catch(() => [] as Array<{ createdAt: Date; _count: number }>),
    prisma.booking.findMany({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, total: true },
    }).catch(() => [] as Array<{ createdAt: Date; total: number }>),
    // Lost leads (finestra 90 dies) per al Loss summary del Canvi #360
    prisma.lead.findMany({
      where: {
        status: 'LOST',
        OR: [
          { lostAt: { gte: lostLeadsSince } },
          { lostAt: null, updatedAt: { gte: lostLeadsSince } },
        ],
      },
      select: {
        id: true,
        name: true,
        lostReason: true,
        lostAt: true,
        eventType: true,
        source: true,
        budget: true,
        eventLocation: true,
      },
    }).catch(() => [] as LossReportLead[]),
  ]);

  const statusMap = leadStats.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count;
    return acc;
  }, {});

  const scored = openLeads.map((lead) => {
    const s = scoreLead({
      status: lead.status,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      eventDate: lead.eventDate,
      budget: lead.budget,
      phone: lead.phone,
      eventLocation: lead.eventLocation,
      guestCount: lead.guestCount,
      interestedPackId: lead.interestedPackId,
      source: lead.source,
    });
    const amount = estimateLeadAmount({ budget: lead.budget, eventType: lead.eventType });
    return {
      ...lead,
      score: s.score,
      probability: s.probability,
      weightedAmount: amount * s.probability,
      amount,
    };
  });

  const weightedForecast = scored.reduce((sum, lead) => sum + lead.weightedAmount, 0);
  const rawPipeline = scored.reduce((sum, lead) => sum + lead.amount, 0);

  // ── Conversion by source ──────────────────────────────────────────────
  const sourceAgg = new Map<string, { total: number; won: number; revenue: number }>();
  for (const row of leadsBySource) {
    const key = row.source || 'UNKNOWN';
    const entry = sourceAgg.get(key) || { total: 0, won: 0, revenue: 0 };
    entry.total += row._count;
    if (row.status === 'WON') entry.won += row._count;
    sourceAgg.set(key, entry);
  }
  // Estimate revenue per won lead from scored data
  for (const lead of scored) {
    const key = lead.source || 'UNKNOWN';
    const entry = sourceAgg.get(key);
    if (entry && lead.status === 'WON') entry.revenue += lead.amount;
  }
  const conversionBySource: ConversionBySource[] = Array.from(sourceAgg.entries())
    .map(([source, v]) => ({
      source,
      total: v.total,
      won: v.won,
      winRate: v.total > 0 ? v.won / v.total : 0,
      avgRevenue: v.won > 0 ? v.revenue / v.won : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // ── Recurrence ──────────────────────────────────────────────────────
  const avgEventsPerCustomer = avgEventsRaw._avg.totalEvents || 0;
  const returningRate = customers > 0 ? returningCustomers / customers : 0;

  // ── Margin ──────────────────────────────────────────────────────────
  const totalRevenue = bookingsWithCost.reduce((s, b) => s + (b.total || 0), 0);
  const totalCost = bookingsWithCost.reduce((s, b) => s + (b.travelCost || 0), 0);
  const grossMargin = totalRevenue - totalCost;
  const marginRate = totalRevenue > 0 ? grossMargin / totalRevenue : 0;

  // ── Monthly trend (6 months) ────────────────────────────────────────
  const trendMap = new Map<string, MonthlyTrend>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendMap.set(key, { month: key, leads: 0, bookings: 0, revenue: 0 });
  }
  for (const row of monthlyLeads) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = trendMap.get(key);
    if (entry) entry.leads += row._count;
  }
  for (const row of monthlyBookings) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = trendMap.get(key);
    if (entry) { entry.bookings++; entry.revenue += row.total || 0; }
  }
  const monthlyTrend = Array.from(trendMap.values());

  return {
    generatedAt: now.toISOString(),
    period: {
      monthStart: startOfMonth.toISOString(),
      quarterStart: startOfQuarter.toISOString(),
    },
    headline: {
      customers,
      openLeads: openLeads.length,
      bookingsClosed: bookingStats._count,
      revenueClosed: Number(bookingStats._sum.total || 0),
      pipelineRaw: rawPipeline,
      forecastWeighted: weightedForecast,
      slaBroken,
    },
    funnel: {
      NEW: statusMap.NEW || 0,
      CONTACTED: statusMap.CONTACTED || 0,
      QUOTE_SENT: statusMap.QUOTE_SENT || 0,
      NEGOTIATING: statusMap.NEGOTIATING || 0,
      WON: statusMap.WON || 0,
      LOST: statusMap.LOST || 0,
    },
    conversionBySource,
    recurrence: {
      totalCustomers: customers,
      returning: returningCustomers,
      returningRate,
      avgEventsPerCustomer,
    },
    margin: {
      totalRevenue,
      totalCost,
      grossMargin,
      marginRate,
    },
    monthlyTrend,
    topRiskLeads: scored
      .sort((a, b) => a.score - b.score)
      .slice(0, 20)
      .map((lead) => ({
        id: lead.id,
        name: lead.name,
        status: lead.status,
        assignedTo: lead.assignedTo,
        source: lead.source,
        score: lead.score,
        probability: lead.probability,
        weightedAmount: lead.weightedAmount,
      })),
    lossSummary: computeLossSummary(lostLeadsRaw as LossReportLead[]),
  };
}


