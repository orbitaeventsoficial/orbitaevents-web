import { prisma } from '@/lib/prisma';
import { estimateLeadAmount, scoreLead } from '@/lib/services/commercialScoring';

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
};

export async function buildExecutiveReport(): Promise<ExecutiveReport> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  const [leadStats, bookingStats, openLeads, customers, slaBroken] = await Promise.all([
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
  };
}

