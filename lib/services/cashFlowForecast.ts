/**
 * cashFlowForecast.ts — Previsió de tresoreria
 *
 * Projecta ingressos i costos mes a mes basant-se en reserves confirmades/preparing.
 * Ingressos previstos = total × % pendent de cobrar
 * Costos previstos = cost estimat via costEngine
 */

import { prisma } from '@/lib/prisma';
import { getProfitabilityConfig } from './profitabilityService';
import { computeBookingFinancialSummary } from './costEngine';

interface CashFlowMonth {
  month: string; // "2026-03"
  income: number;
  costs: number;
  netFlow: number;
  cumulative: number;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function buildCashFlowForecast(monthsAhead = 6): Promise<CashFlowMonth[]> {
  const now = new Date();
  const config = await getProfitabilityConfig();

  // Reserves futures confirmades/preparing
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PREPARING'] },
      eventDate: { gte: now },
    },
    select: {
      eventDate: true,
      total: true,
      depositAmount: true,
      depositPaid: true,
      remainingPaid: true,
      remainingAmount: true,
      travelCost: true,
      distanceKm: true,
      pack: { select: { price: true, extraHourPrice: true } },
      extras: { select: { price: true, quantity: true } },
      extraHours: true,
    },
  });

  // Agrupar per mes
  const monthMap = new Map<string, { income: number; costs: number }>();

  // Inicialitzar mesos
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { income: 0, costs: 0 });
  }

  for (const booking of bookings) {
    const eventDate = new Date(booking.eventDate);
    const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap.has(monthKey)) continue;

    const entry = monthMap.get(monthKey)!;

    // Ingressos pendents de cobrar
    const total = Number(booking.total) || 0;
    const depositAmount = Number(booking.depositAmount) || 0;
    const remainingAmount = Number(booking.remainingAmount) || Math.max(0, total - depositAmount);
    let pendingIncome = 0;
    if (!booking.depositPaid) pendingIncome += depositAmount;
    if (!booking.remainingPaid) pendingIncome += Math.max(0, remainingAmount);
    entry.income += pendingIncome;

    // Cost estimat
    const extrasTotal = (booking.extras || []).reduce(
      (sum, e) => sum + (Number(e.price) || 0) * (Number(e.quantity) || 0),
      0,
    );
    const summary = computeBookingFinancialSummary(
      {
        total,
        packPrice: Number(booking.pack?.price) || 0,
        extrasTotal,
        extraHours: Number(booking.extraHours) || 0,
        extraHourPrice: Number(booking.pack?.extraHourPrice) || 0,
        distanceKm: Number(booking.distanceKm) || 0,
        travelCost: typeof booking.travelCost === 'number' ? booking.travelCost : undefined,
      },
      config,
    );
    entry.costs += summary.directCost;
  }

  // Construir resultat amb acumulat
  let cumulative = 0;
  const result: CashFlowMonth[] = [];

  for (const [month, data] of monthMap) {
    const netFlow = data.income - data.costs;
    cumulative += netFlow;
    result.push({
      month,
      income: roundMoney(data.income),
      costs: roundMoney(data.costs),
      netFlow: roundMoney(netFlow),
      cumulative: roundMoney(cumulative),
    });
  }

  return result;
}
