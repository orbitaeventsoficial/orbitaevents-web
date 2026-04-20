// lib/services/captureHealthService.ts
// ═══════════════════════════════════════════════════════════════════════════
// CAPTURE HEALTH SERVICE
// Avalua l'estat de captació de leads: volum, tendència, origen, acció.
// Quan no hi ha flux de leads, el CRM no té res a gestionar — primer el flux.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type CaptureHealthStatus = 'DROUGHT' | 'FAMINE' | 'LOW' | 'HEALTHY' | 'GROWING';

export type CaptureTrend = 'UP' | 'DOWN' | 'FLAT';

export type CaptureSourceBreakdown = {
  source: string;
  label: string;
  count: number;
  percentage: number;
};

export type CaptureHealthReport = {
  status: CaptureHealthStatus;
  headline: string;
  detail: string;
  leadsLast7d: number;
  leadsPrev7d: number;
  leadsLast30d: number;
  leadsPrev30d: number;
  leadsLast90d: number;
  trend7d: CaptureTrend;
  trendPct7d: number;
  trend30d: CaptureTrend;
  trendPct30d: number;
  sources: CaptureSourceBreakdown[];
  primarySource: string | null;
  suggestedAction: {
    label: string;
    detail: string;
    href: string;
  };
};

export type CaptureHealthInput = {
  leadsLast7d: number;
  leadsPrev7d: number;
  leadsLast30d: number;
  leadsPrev30d: number;
  leadsLast90d: number;
  sourceCounts: Array<{ source: string; count: number }>;
};

// ───────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Web',
  CONFIGURATOR: 'Configurador',
  PHONE: 'Telèfon',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  WALLAPOP: 'Wallapop',
  REFERRAL: 'Referit',
  GOOGLE: 'Google',
  OTHER: 'Altres',
};

// Llindars de salut setmanal (7 dies)
const DROUGHT_THRESHOLD = 0;   // 0 leads → sequera total
const FAMINE_THRESHOLD = 2;    // 1-2 leads → famine
const LOW_THRESHOLD = 5;       // 3-5 leads → volum baix
const HEALTHY_THRESHOLD = 10;  // 6-10 → saludable, >10 → creixement

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function computeTrend(current: number, previous: number): { trend: CaptureTrend; pct: number } {
  if (current === 0 && previous === 0) return { trend: 'FLAT', pct: 0 };
  if (previous === 0) return { trend: 'UP', pct: 100 };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 10) return { trend: 'UP', pct };
  if (pct < -10) return { trend: 'DOWN', pct };
  return { trend: 'FLAT', pct };
}

function determineStatus(leadsLast7d: number): CaptureHealthStatus {
  if (leadsLast7d === DROUGHT_THRESHOLD) return 'DROUGHT';
  if (leadsLast7d <= FAMINE_THRESHOLD) return 'FAMINE';
  if (leadsLast7d <= LOW_THRESHOLD) return 'LOW';
  if (leadsLast7d <= HEALTHY_THRESHOLD) return 'HEALTHY';
  return 'GROWING';
}

function buildHeadline(status: CaptureHealthStatus, leadsLast7d: number): string {
  switch (status) {
    case 'DROUGHT':
      return 'Captació aturada';
    case 'FAMINE':
      return `Captació molt baixa (${leadsLast7d} en 7 dies)`;
    case 'LOW':
      return `Volum baix (${leadsLast7d} en 7 dies)`;
    case 'HEALTHY':
      return `Volum saludable (${leadsLast7d} en 7 dies)`;
    case 'GROWING':
      return `Bon ritme de captació (${leadsLast7d} en 7 dies)`;
  }
}

function buildDetail(status: CaptureHealthStatus, leadsLast30d: number): string {
  switch (status) {
    case 'DROUGHT':
      return `Cap lead nou en 7 dies (${leadsLast30d} en 30 dies). El CRM no té res a gestionar. Focus a atraure, no a gestionar.`;
    case 'FAMINE':
      return `Volum insuficient per sostenir el negoci (${leadsLast30d} en 30 dies). Reforça els canals gratuïts abans de pagar.`;
    case 'LOW':
      return `Captació feble (${leadsLast30d} en 30 dies). Els canals actuals no donen prou. Revisa quins funcionen.`;
    case 'HEALTHY':
      return `Captació estable (${leadsLast30d} en 30 dies). Ara la palanca és millorar la conversió.`;
    case 'GROWING':
      return `Captació en creixement (${leadsLast30d} en 30 dies). Valora escalar els canals que funcionen.`;
  }
}

function buildSuggestedAction(
  status: CaptureHealthStatus,
  primarySource: string | null
): CaptureHealthReport['suggestedAction'] {
  switch (status) {
    case 'DROUGHT':
      return {
        label: 'Executar pla de captació',
        detail: 'Ves al manual i ataca Fase 0 (Google Business, web, ICP) i Fase 1 (canals gratuïts).',
        href: '/admin/manual',
      };
    case 'FAMINE':
      return {
        label: 'Reforçar canals gratuïts',
        detail: 'Activa Fase 1 del pla: Instagram orgànic, ressenyes Google, xarxa personal, partners.',
        href: '/admin/manual',
      };
    case 'LOW':
      return {
        label: 'Revisar quins canals funcionen',
        detail: primarySource
          ? `El canal principal és ${SOURCE_LABELS[primarySource] ?? primarySource}. Dobla'l i afegeix-ne un nou.`
          : 'No hi ha canal dominant. Prioritza un i fes-lo funcionar abans d\'obrir-ne més.',
        href: '/admin/reporting',
      };
    case 'HEALTHY':
      return {
        label: 'Optimitzar conversió',
        detail: 'El volum és suficient. Ara la palanca és pujar el % de leads que acaben reservant.',
        href: '/admin/sales-ops',
      };
    case 'GROWING':
      return {
        label: 'Escalar canals rendibles',
        detail: primarySource
          ? `${SOURCE_LABELS[primarySource] ?? primarySource} és el canal principal. Considera invertir-hi per escalar.`
          : 'Identifica el canal amb més ROI i escala\'l amb inversió controlada.',
        href: '/admin/reporting',
      };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generateCaptureHealth(input: CaptureHealthInput): CaptureHealthReport {
  const status = determineStatus(input.leadsLast7d);
  const { trend: trend7d, pct: trendPct7d } = computeTrend(input.leadsLast7d, input.leadsPrev7d);
  const { trend: trend30d, pct: trendPct30d } = computeTrend(input.leadsLast30d, input.leadsPrev30d);

  // Source breakdown
  const total = input.sourceCounts.reduce((sum, s) => sum + s.count, 0);
  const sources: CaptureSourceBreakdown[] = input.sourceCounts
    .filter((s) => s.count > 0)
    .map((s) => ({
      source: s.source,
      label: SOURCE_LABELS[s.source] ?? s.source,
      count: s.count,
      percentage: total > 0 ? Math.round((s.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const primarySource = sources.length > 0 ? sources[0].source : null;

  return {
    status,
    headline: buildHeadline(status, input.leadsLast7d),
    detail: buildDetail(status, input.leadsLast30d),
    leadsLast7d: input.leadsLast7d,
    leadsPrev7d: input.leadsPrev7d,
    leadsLast30d: input.leadsLast30d,
    leadsPrev30d: input.leadsPrev30d,
    leadsLast90d: input.leadsLast90d,
    trend7d,
    trendPct7d,
    trend30d,
    trendPct30d,
    sources,
    primarySource,
    suggestedAction: buildSuggestedAction(status, primarySource),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadCaptureHealth(now: Date = new Date()): Promise<CaptureHealthReport> {
  const DAY = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY);

  const [
    leadsLast7d,
    leadsPrev7d,
    leadsLast30d,
    leadsPrev30d,
    leadsLast90d,
    sourceGroups,
  ] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { createdAt: { gte: ninetyDaysAgo } },
      _count: { source: true },
    }),
  ]);

  const sourceCounts = sourceGroups.map((g) => ({
    source: g.source,
    count: g._count.source,
  }));

  return generateCaptureHealth({
    leadsLast7d,
    leadsPrev7d,
    leadsLast30d,
    leadsPrev30d,
    leadsLast90d,
    sourceCounts,
  });
}
