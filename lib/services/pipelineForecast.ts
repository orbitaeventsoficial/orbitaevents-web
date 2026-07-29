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

interface ForecastMonth {
  month: string;
  historicalAvg: number;
  pipeline: number;
  pipelineLow: number;
  pipelineHigh: number;
  combined: number;
  combinedLow: number;
  combinedHigh: number;
  /** Ingressos reals del mateix mes calendari l'any anterior (YoY). 0 si no hi ha dades. */
  previousYearActual: number;
  /** Reserves ja confirmades amb event en aquest mes futur (forecast operatiu). */
  confirmedBookings: number;
  /** Ingressos compromesos per les reserves ja confirmades en aquest mes futur. */
  confirmedRevenue: number;
}

export async function buildPipelineForecast(monthsAhead = 6, now: Date = new Date()): Promise<ForecastMonth[]> {
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

  // Agrupar pipeline per mes d'event. Mantenim la suma del pipeline esperat
  // (mean) i la suma de variances Bernoulli (a²·p·(1-p)) per construir banda
  // de confiança ±1σ ("D.14 — Forecast amb confidence band").
  const pipelineByMonth = new Map<string, number>();
  const varianceByMonth = new Map<string, number>();
  for (const lead of activeLeads) {
    const { probability } = scoreLead({ ...lead, now });
    const amount = estimateLeadAmount({ budget: lead.budget, eventType: lead.eventType });
    const weighted = amount * probability;
    const variance = amount * amount * probability * (1 - probability);

    let monthKey: string;
    if (lead.eventDate) {
      const d = new Date(lead.eventDate);
      monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else {
      // Si no té data, distribuir als pròxims 3 mesos. La variància es
      // divideix per 9 perquè cadascun dels 3 mesos rep `weighted/3` (les
      // contribucions són independents).
      for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        pipelineByMonth.set(k, (pipelineByMonth.get(k) || 0) + weighted / 3);
        varianceByMonth.set(k, (varianceByMonth.get(k) || 0) + variance / 9);
      }
      continue;
    }
    pipelineByMonth.set(monthKey, (pipelineByMonth.get(monthKey) || 0) + weighted);
    varianceByMonth.set(monthKey, (varianceByMonth.get(monthKey) || 0) + variance);
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

  // 2b. Reserves ja confirmades amb event futur (forecast operatiu)
  const forecastEnd = new Date(now.getFullYear(), now.getMonth() + monthsAhead + 1, 1);
  const confirmedFuture = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] },
      eventDate: { gte: now, lt: forecastEnd },
    },
    select: {
      eventDate: true,
      total: true,
    },
  });

  const confirmedByMonth = new Map<string, { count: number; revenue: number }>();
  for (const b of confirmedFuture) {
    const d = new Date(b.eventDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const current = confirmedByMonth.get(key) ?? { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += Number(b.total) || 0;
    confirmedByMonth.set(key, current);
  }

  // Agrupar per (any, mes) per calcular total mensual real
  const monthlyRevByYearMonth = new Map<string, number>(); // "2024-06" → total revenue
  for (const b of historicBookings) {
    const d = new Date(b.eventDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevByYearMonth.set(key, (monthlyRevByYearMonth.get(key) || 0) + (Number(b.total) || 0));
  }

  // Agrupar per mes calendari (1-12) → array de totals mensuals (un per any)
  const monthlyTotals = new Map<number, number[]>();
  for (const [key, total] of monthlyRevByYearMonth) {
    const m = parseInt(key.split('-')[1], 10);
    const totals = monthlyTotals.get(m) || [];
    totals.push(total);
    monthlyTotals.set(m, totals);
  }

  // Mitjana mensual per mes calendari (total ingressos / nombre d'anys amb dades)
  const monthlyAvg = new Map<number, number>();
  for (const [m, totals] of monthlyTotals) {
    monthlyAvg.set(m, totals.reduce((a, b) => a + b, 0) / totals.length);
  }

  // Mitjana global per mes (fallback)
  const allAvgs = Array.from(monthlyAvg.values());
  const globalMonthlyAvg = allAvgs.length > 0
    ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length
    : 0;

  // 3. Construir previsió (comença al mes SEGÜENT per evitar solapament amb dades històriques)
  const result: ForecastMonth[] = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const calMonth = d.getMonth() + 1;

    const historicalAvg = monthlyAvg.get(calMonth) ?? globalMonthlyAvg;
    const pipeline = pipelineByMonth.get(monthKey) ?? 0;
    const variance = varianceByMonth.get(monthKey) ?? 0;
    // Banda ±1σ del pipeline (Bernoulli per lead, sumes assumides
    // independents). Mai negativa.
    const stdDev = Math.sqrt(variance);
    const pipelineLow = Math.max(0, pipeline - stdDev);
    const pipelineHigh = pipeline + stdDev;

    // Combinació: 60% pipeline (si n'hi ha) + 40% històric, o 100% històric si no hi ha pipeline
    const combine = (p: number) =>
      pipeline > 0 ? Math.round(p * 0.6 + historicalAvg * 0.4) : Math.round(historicalAvg);
    const combined = combine(pipeline);
    const combinedLow = combine(pipelineLow);
    const combinedHigh = combine(pipelineHigh);

    // YoY — ingressos reals del mateix mes calendari l'any anterior
    const prevYearKey = `${d.getFullYear() - 1}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const previousYearActual = monthlyRevByYearMonth.get(prevYearKey) ?? 0;

    // Forecast operatiu — reserves ja confirmades amb event en aquest mes
    const confirmedSlot = confirmedByMonth.get(monthKey) ?? { count: 0, revenue: 0 };

    result.push({
      month: monthKey,
      historicalAvg: Math.round(historicalAvg),
      pipeline: Math.round(pipeline),
      pipelineLow: Math.round(pipelineLow),
      pipelineHigh: Math.round(pipelineHigh),
      combined,
      combinedLow,
      combinedHigh,
      previousYearActual: Math.round(previousYearActual),
      confirmedBookings: confirmedSlot.count,
      confirmedRevenue: Math.round(confirmedSlot.revenue * 100) / 100,
    });
  }

  return result;
}
