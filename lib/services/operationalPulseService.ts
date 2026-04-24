// lib/services/operationalPulseService.ts
// ═══════════════════════════════════════════════════════════════════════════
// OPERATIONAL PULSE SERVICE
// Mètriques de salut operativa en temps real: velocitat de resposta,
// taxa de seguiment, salut del pipeline, capacitat operativa.
// Funció pura + wrapper.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { loadPendingFollowUps } from '@/lib/services/responseTrackingService';
import { loadPipelineSuggestions, type PipelineSuggestion, type SuggestionPriority } from '@/lib/services/leadPipelineSuggestionsService';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type PulseLevel = 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';

export type PulseMetric = {
  key: string;
  label: string;
  value: number;
  unit: string;
  level: PulseLevel;
  target: string;
};

export type PulsePipelineDriver = {
  type: PipelineSuggestion['type'];
  priority: Exclude<SuggestionPriority, 'INFO'>;
  title: string;
  detail: string;
  href: string;
  count: number;
};

export type OperationalPulse = {
  overallLevel: PulseLevel;
  overallScore: number;
  metrics: PulseMetric[];
  pipelineDrivers: PulsePipelineDriver[];
  generatedAt: string;
};

export type PulseInput = {
  avgResponseHours: number;
  slaComplianceRate: number;
  followUpRate: number;
  pipelineHealthRate: number;
  pipelineConversionRate: number;
  overdueTasksRate: number;
  paymentCollectionRate: number;
  customerRetentionRate: number;
  pipelineDrivers?: PulsePipelineDriver[];
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function level(value: number, thresholds: [number, number, number]): PulseLevel {
  const [excellent, good, warning] = thresholds;
  if (value >= excellent) return 'EXCELLENT';
  if (value >= good) return 'GOOD';
  if (value >= warning) return 'WARNING';
  return 'CRITICAL';
}

function levelInverse(value: number, thresholds: [number, number, number]): PulseLevel {
  const [excellent, good, warning] = thresholds;
  if (value <= excellent) return 'EXCELLENT';
  if (value <= good) return 'GOOD';
  if (value <= warning) return 'WARNING';
  return 'CRITICAL';
}

const LEVEL_SCORE: Record<PulseLevel, number> = {
  EXCELLENT: 100,
  GOOD: 75,
  WARNING: 50,
  CRITICAL: 25,
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generateOperationalPulse(input: PulseInput): OperationalPulse {
  const metrics: PulseMetric[] = [
    {
      key: 'responseTime',
      label: 'Temps de resposta',
      value: Math.round(input.avgResponseHours * 10) / 10,
      unit: 'h',
      level: levelInverse(input.avgResponseHours, [4, 12, 24]),
      target: '< 4h',
    },
    {
      key: 'slaCompliance',
      label: 'Compliment SLA',
      value: Math.round(input.slaComplianceRate),
      unit: '%',
      level: level(input.slaComplianceRate, [90, 75, 50]),
      target: '> 90%',
    },
    {
      key: 'followUp',
      label: 'Taxa de seguiment',
      value: Math.round(input.followUpRate),
      unit: '%',
      level: level(input.followUpRate, [80, 60, 40]),
      target: '> 80%',
    },
    {
      key: 'pipelineHealth',
      label: 'Salut pipeline',
      value: Math.round(input.pipelineHealthRate),
      unit: '%',
      level: level(input.pipelineHealthRate, [85, 70, 50]),
      target: '> 85%',
    },
    {
      key: 'pipelineConversion',
      label: 'Conversió pipeline',
      value: Math.round(input.pipelineConversionRate),
      unit: '%',
      level: level(input.pipelineConversionRate, [30, 20, 10]),
      target: '> 30%',
    },
    {
      key: 'overdueTasks',
      label: 'Tasques vençudes',
      value: Math.round(input.overdueTasksRate),
      unit: '%',
      level: levelInverse(input.overdueTasksRate, [5, 15, 30]),
      target: '< 5%',
    },
    {
      key: 'paymentCollection',
      label: 'Cobrament',
      value: Math.round(input.paymentCollectionRate),
      unit: '%',
      level: level(input.paymentCollectionRate, [95, 80, 60]),
      target: '> 95%',
    },
    {
      key: 'retention',
      label: 'Retenció clients',
      value: Math.round(input.customerRetentionRate),
      unit: '%',
      level: level(input.customerRetentionRate, [70, 50, 30]),
      target: '> 70%',
    },
  ];

  const totalScore = metrics.reduce((sum, m) => sum + LEVEL_SCORE[m.level], 0);
  const overallScore = Math.round(totalScore / metrics.length);

  const criticals = metrics.filter((m) => m.level === 'CRITICAL').length;
  const warnings = metrics.filter((m) => m.level === 'WARNING').length;
  let overallLevel: PulseLevel;
  if (criticals >= 2) overallLevel = 'CRITICAL';
  else if (criticals >= 1 || warnings >= 3) overallLevel = 'WARNING';
  else if (overallScore >= 85) overallLevel = 'EXCELLENT';
  else overallLevel = 'GOOD';

  return {
    overallLevel,
    overallScore,
    metrics,
    pipelineDrivers: input.pipelineDrivers ?? [],
    generatedAt: input.now.toISOString(),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadOperationalPulse(now: Date = new Date()): Promise<OperationalPulse> {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const slaThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    recentLeads,
    totalNewLeads,
    slaBreachedCount,
    contactedLeads,
    wonLeads,
    totalPipelineLeads,
    pendingFollowUpSummary,
    pipelineSuggestions,
    totalTasks,
    overdueTasks,
    totalBookings,
    paidBookings,
    totalCustomers,
    activeCustomers,
  ] = await Promise.all([
    // Average response time: leads contacted within 30d
    prisma.lead.findMany({
      where: { contactedAt: { not: null }, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, contactedAt: true },
      take: 100,
    }),
    // SLA compliance
    prisma.lead.count({ where: { status: 'NEW', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.lead.count({ where: { status: 'NEW', createdAt: { lte: slaThreshold, gte: thirtyDaysAgo } } }),
    // Follow-up rate
    prisma.lead.count({ where: { status: { not: 'NEW' }, createdAt: { gte: thirtyDaysAgo } } }),
    // Pipeline conversion
    prisma.lead.count({ where: { status: 'WON', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    loadPendingFollowUps(now, 200),
    loadPipelineSuggestions(now),
    // Tasks
    prisma.task.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.task.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: todayStart } } }),
    // Payment
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, eventDate: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, remainingPaid: true, eventDate: { gte: thirtyDaysAgo } } }),
    // Retention
    prisma.customer.count(),
    prisma.customer.count({ where: { lifecycleStage: { in: ['RETURNING', 'VIP'] } } }),
  ]);

  // Compute avg response hours
  let avgResponseHours = 24;
  if (recentLeads.length > 0) {
    const totalHours = recentLeads.reduce((sum, l) => {
      if (!l.contactedAt) return sum;
      return sum + (l.contactedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60);
    }, 0);
    avgResponseHours = totalHours / recentLeads.length;
  }

  const slaComplianceRate = totalNewLeads > 0
    ? ((totalNewLeads - slaBreachedCount) / totalNewLeads) * 100
    : 100;
  // followUpRate i pipelineHealthRate: els numeradors (pendingFollowUpSummary,
  // pipelineSuggestions) no estan restringits a la finestra de 30d que defineix
  // els denominadors (contactedLeads, totalPipelineLeads). Un follow-up/suggestió
  // sobre un lead antic pot fer que la resta sigui negativa. Clampem a [0, 100]
  // per no renderitzar percentatges sense sentit al pulse del cockpit.
  const followUpRate = contactedLeads > 0
    ? Math.max(0, ((contactedLeads - pendingFollowUpSummary.total) / contactedLeads) * 100)
    : 100;
  const flaggedLeadIds = new Set(
    pipelineSuggestions
      .flatMap((suggestion) => suggestion.leadIds)
      .filter((leadId) => leadId.length > 0),
  );
  const pipelineHealthRate = totalPipelineLeads > 0
    ? Math.max(0, ((totalPipelineLeads - flaggedLeadIds.size) / totalPipelineLeads) * 100)
    : 100;
  const pipelineConversionRate = totalPipelineLeads > 0 ? (wonLeads / totalPipelineLeads) * 100 : 0;
  const overdueTasksRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;
  const paymentCollectionRate = totalBookings > 0 ? (paidBookings / totalBookings) * 100 : 100;
  const customerRetentionRate = totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;
  const pipelineDrivers: PulsePipelineDriver[] = pipelineSuggestions
    .filter((suggestion): suggestion is PipelineSuggestion & { priority: Exclude<SuggestionPriority, 'INFO'> } => suggestion.priority !== 'INFO')
    .slice(0, 3)
    .map((suggestion) => ({
      type: suggestion.type,
      priority: suggestion.priority,
      title: suggestion.title,
      detail: suggestion.detail,
      href: suggestion.href,
      count: suggestion.count,
    }));

  return generateOperationalPulse({
    avgResponseHours,
    slaComplianceRate,
    followUpRate,
    pipelineHealthRate,
    pipelineConversionRate,
    overdueTasksRate,
    paymentCollectionRate,
    customerRetentionRate,
    pipelineDrivers,
    now,
  });
}
