/**
 * pipelineForecast.ts — Previsió de vendes i anàlisi estacional
 *
 * Combina:
 * 1. Pipeline ponderat: leads actius × probabilitat × import estimat
 * 2. Mitjana històrica: reserves passades per mes → patró estacional
 * 3. Previsió combinada: historical_average × seasonal_factor + pipeline_weighted
 */

import { prisma } from '@/lib/prisma';
import { scoreLead, estimateLeadAmount } from './commercialScoring';

export interface ForecastMonth {
  month: string;
  historicalAvg: number;
  pipeline: number;
  combined: number;
}

export async function buildPipelineForecast(monthsAhead = 6): Promise<ForecastMonth[]> {
  const now = new Date();

  // 1. Pipeline ponderat — leads actius
  const activeLeads = await prisma.lead.findMany({
    where: {
      status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
    },
    select: {
      status: true,
      createdAt: true,
      updatedAt: true,
      eventDate: true,
      budget: true,
      phone: true,
      eventLocation: true,
      guestCount: true,
      interestedPackId: true,
      source: true,
      eventType: true,
    },
  });

  // Agrupar pipeline per mes d'event
  const pipelineByMonth = new Map<string, number>();
  for (const lead of activeLeads) {
    const { probability } = scoreLead(lead);
    const amount = estimateLeadAmount({ budget: lead.budget, eventType: lead.eventType });
    const weighted = amount * probability;

    let monthKey: string;
    if (lead.eventDate) {
      const d = new Date(lead.eventDate);
      monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // Si no té data, distribuir als pròxims 3 mesos
      for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        pipelineByMonth.set(k, (pipelineByMonth.get(k) || 0) + weighted / 3);
      }
      continue;
    }
    pipelineByMonth.set(monthKey, (pipelineByMonth.get(monthKey) || 0) + weighted);
  }

  // 2. Històric — reserves completades/confirmades dels últims 24 mesos
  const historicStart = new Date(now.getFullYear() - 2, now.getMonth(), 1);
  const historicBookings = await prisma.booking.findMany({
    where: {
      status: { in: ['COMPLETED', 'CONFIRMED'] },
      eventDate: { gte: historicStart, lt: now },
    },
    select: {
      eventDate: true,
      total: true,
    },
  });

  // Agrupar per mes de l'any (1-12) per calcular estacionalitat
  const monthlyTotals = new Map<number, number[]>(); // month(1-12) → array of totals
  for (const b of historicBookings) {
    const d = new Date(b.eventDate);
    const m = d.getMonth() + 1;
    const totals = monthlyTotals.get(m) || [];
    totals.push(Number(b.total) || 0);
    monthlyTotals.set(m, totals);
  }

  // Mitjana per mes
  const monthlyAvg = new Map<number, number>();
  for (const [m, totals] of monthlyTotals) {
    monthlyAvg.set(m, totals.reduce((a, b) => a + b, 0) / totals.length);
  }

  // Mitjana global per mes (fallback)
  const allAvgs = Array.from(monthlyAvg.values());
  const globalMonthlyAvg = allAvgs.length > 0
    ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length
    : 0;

  // 3. Construir previsió
  const result: ForecastMonth[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const calMonth = d.getMonth() + 1;

    const historicalAvg = monthlyAvg.get(calMonth) ?? globalMonthlyAvg;
    const pipeline = pipelineByMonth.get(monthKey) ?? 0;

    // Combinació: 60% pipeline (si n'hi ha) + 40% històric, o 100% històric si no hi ha pipeline
    const combined = pipeline > 0
      ? Math.round(pipeline * 0.6 + historicalAvg * 0.4)
      : Math.round(historicalAvg);

    result.push({
      month: monthKey,
      historicalAvg: Math.round(historicalAvg),
      pipeline: Math.round(pipeline),
      combined,
    });
  }

  return result;
}
