// lib/services/weeklyBenchmarkService.ts
// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY BENCHMARK SERVICE
// Genera un resum setmanal comparatiu (setmana actual vs anterior).
// S'envia per email cada dilluns a les 9h.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { sendTrackedStandaloneEmail } from '@/lib/email';
import { SITE_CONFIG } from '@/app/config/site-config';
import { log } from '@/lib/logger';
import { saveCronRunStatus } from '@/lib/services/cronRunStatusService';
import { getRecipientsAsString } from '@/lib/services/notificationRecipientsService';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type WeeklyMetric = {
  label: string;
  current: number;
  previous: number;
  unit: string;
};

export type WeeklyBenchmarkReport = {
  generatedAt: string;
  weekLabel: string;
  metrics: WeeklyMetric[];
  verdict: string;
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export type WeeklyBenchmarkInput = {
  leadsThisWeek: number;
  leadsPrevWeek: number;
  bookingsThisWeek: number;
  bookingsPrevWeek: number;
  revenueThisWeek: number;
  revenuePrevWeek: number;
  wonThisWeek: number;
  wonPrevWeek: number;
  lostThisWeek: number;
  lostPrevWeek: number;
  tasksCompletedThisWeek: number;
  tasksCompletedPrevWeek: number;
  now: Date;
};

function pctChange(current: number, previous: number): string {
  if (previous === 0 && current === 0) return '=';
  if (previous === 0) return '+∞';
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return '=';
}

function weekLabel(now: Date): string {
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  return `${start.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

export function generateWeeklyBenchmark(input: WeeklyBenchmarkInput): WeeklyBenchmarkReport {
  const metrics: WeeklyMetric[] = [
    { label: 'Leads nous', current: input.leadsThisWeek, previous: input.leadsPrevWeek, unit: '' },
    { label: 'Reserves noves', current: input.bookingsThisWeek, previous: input.bookingsPrevWeek, unit: '' },
    { label: 'Ingressos', current: input.revenueThisWeek, previous: input.revenuePrevWeek, unit: '€' },
    { label: 'Leads guanyats (WON)', current: input.wonThisWeek, previous: input.wonPrevWeek, unit: '' },
    { label: 'Leads perduts (LOST)', current: input.lostThisWeek, previous: input.lostPrevWeek, unit: '' },
    { label: 'Tasques completades', current: input.tasksCompletedThisWeek, previous: input.tasksCompletedPrevWeek, unit: '' },
  ];

  let verdict: string;
  if (input.leadsThisWeek === 0 && input.leadsPrevWeek === 0) {
    verdict = '🏜️ Captació aturada dues setmanes seguides. Acció urgent: executa Fase 0/1 del pla de captació.';
  } else if (input.leadsThisWeek === 0) {
    verdict = '📉 Cap lead aquesta setmana (la setmana passada: ' + input.leadsPrevWeek + '). Revisa els canals.';
  } else if (input.leadsPrevWeek === 0) {
    verdict = '🚀 ' + input.leadsThisWeek + ' lead' + (input.leadsThisWeek === 1 ? '' : 's') + ' nou' + (input.leadsThisWeek === 1 ? '' : 's') + ' després d\'una setmana a 0. Assegura\'t de respondre ràpid.';
  } else if (input.leadsThisWeek > input.leadsPrevWeek * 1.3) {
    verdict = '🚀 Setmana de creixement! ' + pctChange(input.leadsThisWeek, input.leadsPrevWeek) + ' en leads. Assegura\'t de respondre ràpid.';
  } else if (input.leadsThisWeek < input.leadsPrevWeek * 0.7) {
    verdict = '⚠️ Baixada significativa de leads (' + pctChange(input.leadsThisWeek, input.leadsPrevWeek) + '). Revisa si algun canal ha caigut.';
  } else {
    verdict = '✅ Setmana estable. Continua amb la rutina comercial i revisa les tasques pendents.';
  }

  return {
    generatedAt: input.now.toISOString(),
    weekLabel: weekLabel(input.now),
    metrics,
    verdict,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function runWeeklyBenchmark(now: Date = new Date()): Promise<WeeklyBenchmarkReport> {
  const DAY = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);

  const [
    leadsThisWeek,
    leadsPrevWeek,
    bookingsThisWeek,
    bookingsPrevWeek,
    revenueThisWeekAgg,
    revenuePrevWeekAgg,
    wonThisWeek,
    wonPrevWeek,
    lostThisWeek,
    lostPrevWeek,
    tasksCompletedThisWeek,
    tasksCompletedPrevWeek,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.booking.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.booking.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.booking.aggregate({ _sum: { total: true }, where: { createdAt: { gte: sevenDaysAgo }, status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] } } }),
    prisma.booking.aggregate({ _sum: { total: true }, where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }, status: { in: ['CONFIRMED', 'PREPARING', 'COMPLETED'] } } }),
    prisma.lead.count({ where: { status: 'WON', updatedAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { status: 'WON', updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.lead.count({ where: { status: 'LOST', updatedAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { status: 'LOST', updatedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.task.count({ where: { status: 'DONE', completedAt: { gte: sevenDaysAgo } } }),
    prisma.task.count({ where: { status: 'DONE', completedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
  ]);

  const report = generateWeeklyBenchmark({
    leadsThisWeek,
    leadsPrevWeek,
    bookingsThisWeek,
    bookingsPrevWeek,
    revenueThisWeek: revenueThisWeekAgg._sum.total ?? 0,
    revenuePrevWeek: revenuePrevWeekAgg._sum.total ?? 0,
    wonThisWeek,
    wonPrevWeek,
    lostThisWeek,
    lostPrevWeek,
    tasksCompletedThisWeek,
    tasksCompletedPrevWeek,
    now,
  });

  // Send email
  const recipient = (await getRecipientsAsString('reports')) || SITE_CONFIG.business.email;
  const html = buildEmailHtml(report);
  try {
    await sendTrackedStandaloneEmail({
      templateKey: 'weekly-benchmark',
      to: recipient,
      subject: `📊 Benchmark setmanal · ${report.weekLabel}`,
      html,
      orbita: { kind: 'admin', origin: 'weekly-benchmark' },
    });
  } catch (err) {
    log.error('Weekly benchmark email failed', err);
  }

  await saveCronRunStatus({
    prefix: 'benchmark.weekly',
    status: 'ok',
    summary: report,
    category: 'config',
  });

  return report;
}

// ───────────────────────────────────────────────────────────────────────────
// EMAIL HTML
// ───────────────────────────────────────────────────────────────────────────

function buildEmailHtml(report: WeeklyBenchmarkReport): string {
  const rows = report.metrics.map((m) => {
    const change = pctChange(m.current, m.previous);
    const color = m.current > m.previous ? '#10b981' : m.current < m.previous ? '#f43f5e' : '#64748b';
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b">${m.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;font-weight:bold">${m.current}${m.unit}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;opacity:0.6">${m.previous}${m.unit}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;color:${color};font-weight:bold">${change}</td>
      </tr>`;
  }).join('');

  return `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0b1120;color:#e2e8f0;padding:24px;border-radius:12px">
      <h2 style="margin:0 0 4px 0;color:#f8fafc">Benchmark setmanal</h2>
      <p style="margin:0 0 20px 0;opacity:0.6;font-size:13px">${report.weekLabel}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="opacity:0.5;font-size:11px;text-transform:uppercase;letter-spacing:0.5px">
            <th style="padding:6px 12px;text-align:left">Mètrica</th>
            <th style="padding:6px 12px;text-align:right">Aquesta setmana</th>
            <th style="padding:6px 12px;text-align:right">Anterior</th>
            <th style="padding:6px 12px;text-align:right">Canvi</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:20px;padding:12px 16px;background:#1e293b;border-radius:8px;font-size:14px">
        <strong>Veredicte:</strong> ${report.verdict}
      </div>
      <p style="margin-top:16px;opacity:0.4;font-size:11px">Generat automàticament per Òrbita Events CRM · <a href="https://orbitaevents.com/admin" style="color:#60a5fa">Obrir admin</a></p>
    </div>
  `;
}
