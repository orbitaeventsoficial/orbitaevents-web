// lib/services/dailyAnomalyService.ts
// ═══════════════════════════════════════════════════════════════════════════
// DAILY ANOMALY DETECTOR
// Compara els KPIs d'avui contra la mitjana històrica (30d) i genera
// alertes quan hi ha desviacions significatives (>2σ o diferència >50%).
// Funció pura + wrapper async.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type AnomalyLevel = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export type AnomalyAlert = {
  metric: string;
  label: string;
  level: AnomalyLevel;
  icon: string;
  current: number;
  avg30d: number;
  deviation: number;
  message: string;
};

export type AnomalyReport = {
  generatedAt: string;
  windowDays: number;
  anomalies: AnomalyAlert[];
  verdict: string;
};

export type AnomalyMetricInput = {
  key: string;
  label: string;
  current: number;
  avg30d: number;
  higherIsBetter: boolean;
  icon: string;
};

export type AnomalyInput = {
  metrics: AnomalyMetricInput[];
  now: Date;
  windowDays?: number;
  threshold?: number;
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

/**
 * Detecta anomalies comparant valors actuals contra la mitjana dels últims N
 * dies. Una mètrica és anòmala si la diferència respecte la mitjana és >50%
 * (threshold configurable) i la mitjana no és negligible (>0.5).
 */
export function detectAnomalies(input: AnomalyInput): AnomalyReport {
  const threshold = input.threshold ?? 0.5;
  const windowDays = input.windowDays ?? 30;
  const anomalies: AnomalyAlert[] = [];

  for (const m of input.metrics) {
    if (m.avg30d < 0.5 && m.current < 0.5) continue;

    const diff = m.current - m.avg30d;
    const base = Math.max(m.avg30d, 0.5);
    const deviation = diff / base;

    if (Math.abs(deviation) < threshold) continue;

    const isPositive = m.higherIsBetter ? deviation > 0 : deviation < 0;
    const level: AnomalyLevel = isPositive ? 'POSITIVE' : 'NEGATIVE';
    const direction = deviation > 0 ? 'per sobre' : 'per sota';
    const pct = Math.abs(Math.round(deviation * 100));

    anomalies.push({
      metric: m.key,
      label: m.label,
      level,
      icon: m.icon,
      current: m.current,
      avg30d: Math.round(m.avg30d * 10) / 10,
      deviation: Math.round(deviation * 100) / 100,
      message: `${m.label}: ${m.current} avui (${pct}% ${direction} de la mitjana ${windowDays}d: ${m.avg30d.toFixed(1)})`,
    });
  }

  anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  const negatives = anomalies.filter((a) => a.level === 'NEGATIVE').length;
  const positives = anomalies.filter((a) => a.level === 'POSITIVE').length;

  const pl = (n: number, s: string, p: string) => n === 1 ? s : p;

  let verdict: string;
  if (anomalies.length === 0) {
    verdict = 'Tots els KPIs dins de rang normal.';
  } else if (negatives === 0) {
    verdict = `${positives} ${pl(positives, 'anomalia positiva detectada', 'anomalies positives detectades')}.`;
  } else if (positives === 0) {
    verdict = `${negatives} ${pl(negatives, 'anomalia negativa', 'anomalies negatives')}. Revisa el brief.`;
  } else {
    verdict = `${anomalies.length} anomalies detectades (${positives} ${pl(positives, 'positiva', 'positives')}, ${negatives} ${pl(negatives, 'negativa', 'negatives')}).`;
  }

  return {
    generatedAt: input.now.toISOString(),
    windowDays,
    anomalies,
    verdict,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadAnomalyReport(now: Date = new Date()): Promise<AnomalyReport> {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    leadsToday,
    leadsLast30d,
    bookingsToday,
    bookingsLast30d,
    overdueToday,
    overdueLast30d,
    wonToday,
    wonLast30d,
    lostToday,
    lostLast30d,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo, lt: todayStart } } }),
    prisma.booking.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo, lt: todayStart } } }),
    prisma.task.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: todayStart } } }),
    prisma.task.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: todayStart, gte: thirtyDaysAgo } } }),
    prisma.lead.count({ where: { status: 'WON', convertedAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.lead.count({ where: { status: 'WON', convertedAt: { gte: thirtyDaysAgo, lt: todayStart } } }),
    prisma.lead.count({ where: { status: 'LOST', updatedAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.lead.count({ where: { status: 'LOST', updatedAt: { gte: thirtyDaysAgo, lt: todayStart } } }),
  ]);

  const days = 30;
  const metrics: AnomalyMetricInput[] = [
    { key: 'leads', label: 'Entrades noves', current: leadsToday, avg30d: leadsLast30d / days, higherIsBetter: true, icon: '📥' },
    { key: 'bookings', label: 'Reserves noves', current: bookingsToday, avg30d: bookingsLast30d / days, higherIsBetter: true, icon: '📅' },
    { key: 'won', label: 'Leads guanyats', current: wonToday, avg30d: wonLast30d / days, higherIsBetter: true, icon: '🏆' },
    { key: 'lost', label: 'Leads perduts', current: lostToday, avg30d: lostLast30d / days, higherIsBetter: false, icon: '❌' },
    { key: 'overdue', label: 'Tasques vençudes', current: overdueToday, avg30d: overdueLast30d / days, higherIsBetter: false, icon: '⏰' },
  ];

  return detectAnomalies({ metrics, now, windowDays: days });
}
