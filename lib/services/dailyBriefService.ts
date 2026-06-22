// lib/services/dailyBriefService.ts
// ═══════════════════════════════════════════════════════════════════════════
// DAILY BRIEF SERVICE
// Compila un resum operatiu diari unificant: KPIs, alertes, tasques,
// campanyes suggerides i accions prioritàries. Funció pura + wrapper.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { LEAD_SCORING_STATUS_PROBABILITY, parseBudgetAmount } from '@/lib/constants';
import { generateCampaigns, type Campaign } from './campaignService';
import { deriveLeadResponseState, loadPendingFollowUps } from '@/lib/services/responseTrackingService';
import { loadPipelineSuggestions } from '@/lib/services/leadPipelineSuggestionsService';
import { loadSocialContentPulse } from '@/lib/services/socialContentPulseService';

// Wrapper de la font canònica `parseBudgetAmount` (lib/constants); retorna 0 en
// comptes de null per als consumidors que sumen el valor.
export function parseBudgetValue(input?: string | null): number {
  return parseBudgetAmount(input) ?? 0;
}

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type AlertLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export type SocialBriefContent = {
  daysSinceLastPost: number | null;
  isActive: boolean;
  consistencyScore: number;
  draftsPending: number;
  scheduledUpcoming: number;
};

export type BriefAlert = {
  level: AlertLevel;
  icon: string;
  title: string;
  detail: string;
  href: string;
};

export type BriefAction = {
  priority: number;
  label: string;
  detail: string;
  href: string;
};

export type DailyBrief = {
  date: string;
  greeting: string;
  summary: string;
  kpis: {
    newLeadsToday: number;
    openLeads: number;
    overdueTasksCount: number;
    upcomingBookings7d: number;
    pendingPaymentsCount: number;
    forecastWeighted: number;
  };
  alerts: BriefAlert[];
  actions: BriefAction[];
  topCampaigns: Array<{ name: string; type: string; audienceSize: number; urgency: string }>;
  socialContent: SocialBriefContent | null;
};

export type DailyBriefInput = {
  newLeadsToday: number;
  openLeads: number;
  overdueTasksCount: number;
  upcomingBookings7d: number;
  pendingPaymentsCount: number;
  forecastWeighted: number;
  slaBroken: number;
  staleLeadsCount: number;
  postEventPending: number;
  dormantCustomers: number;
  atRiskCustomers: number;
  campaigns: Campaign[];
  pendingFollowUps: number;
  urgentFollowUps: number;
  repliedLeadsAwaitingAction: number;
  pipelineHotUncontacted: number;
  pipelineQuoteNoReply: number;
  pipelineEventSoonNoBooking: number;
  leadsLast7d: number;
  leadsLast30d: number;
  now: Date;
  socialContent?: SocialBriefContent;
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function getGreeting(hour: number): string {
  if (hour < 12) return 'Bon dia';
  if (hour < 18) return 'Bona tarda';
  return 'Bona nit';
}

function buildSummary(input: DailyBriefInput): string {
  if (input.leadsLast7d === 0) {
    return "Captació aturada. 0 leads en 7 dies. El focus d'avui és atraure, no gestionar.";
  }

  if (input.leadsLast7d <= 2) {
    return `Captació molt baixa: ${input.leadsLast7d} leads en 7 dies. Cal reforçar canals urgentment.`;
  }

  const parts: string[] = [];

  if (input.newLeadsToday > 0) {
    parts.push(`${input.newLeadsToday} ${plural(input.newLeadsToday, 'entrada nova', 'entrades noves')}`);
  }

  if (input.overdueTasksCount > 0) {
    parts.push(`${input.overdueTasksCount} ${plural(input.overdueTasksCount, 'tasca vençuda', 'tasques vençudes')}`);
  }

  if (input.upcomingBookings7d > 0) {
    parts.push(`${input.upcomingBookings7d} ${plural(input.upcomingBookings7d, 'reserva', 'reserves')} en 7 dies`);
  }

  if (input.pendingPaymentsCount > 0) {
    parts.push(`${input.pendingPaymentsCount} ${plural(input.pendingPaymentsCount, 'cobrament pendent', 'cobraments pendents')}`);
  }

  if (parts.length === 0) return 'Tot al dia. Cap urgència pendent.';
  return parts.join(' · ');
}

function buildReplyAlertTitle(count: number): string {
  return `${count} ${plural(count, "resposta pendent d'acció", "respostes pendents d'acció")}`;
}

/**
 * Retorna la forma singular o plural catalana segons el comptador.
 * Úsa-ho amb frases completes: `${n} ${plural(n, 'tasca vençuda', 'tasques vençudes')}`.
 */
function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generateDailyBrief(input: DailyBriefInput): DailyBrief {
  const alerts: BriefAlert[] = [];
  const actions: BriefAction[] = [];

  const isLeadDrought = input.leadsLast7d === 0;
  const isLeadFamine = !isLeadDrought && input.leadsLast7d <= 2;

  if (isLeadDrought) {
    alerts.push({
      level: 'CRITICAL',
      icon: '🏜️',
      title: 'Captació aturada — 0 leads en 7 dies',
      detail: 'El problema no és gestionar el CRM, és atraure gent. Ves al pla de captació i executa la Fase 0/1.',
      href: '/admin/manual',
    });
  } else if (isLeadFamine) {
    alerts.push({
      level: 'CRITICAL',
      icon: '⚠️',
      title: `Captació molt baixa — només ${input.leadsLast7d} ${plural(input.leadsLast7d, 'lead', 'leads')} en 7 dies`,
      detail: "Volum insuficient per convertir. Reforça els canals de captació abans que s'aturi del tot.",
      href: '/admin/manual',
    });
  }

  if (input.slaBroken > 0) {
    alerts.push({
      level: 'CRITICAL',
      icon: '🚨',
      title: `${input.slaBroken} ${plural(input.slaBroken, 'entrada', 'entrades')} sense resposta (+24h)`,
      detail: 'Contacta-les avui o es perdran.',
      href: '/admin/leads?status=NEW',
    });
  }

  if (input.overdueTasksCount > 0) {
    alerts.push({
      level: 'CRITICAL',
      icon: '⏰',
      title: `${input.overdueTasksCount} ${plural(input.overdueTasksCount, 'tasca vençuda', 'tasques vençudes')}`,
      detail: 'Tanca-les o replanifica-les.',
      href: '/admin/tasks',
    });
  }

  if (input.pendingPaymentsCount > 0) {
    alerts.push({
      level: 'WARNING',
      icon: '💸',
      title: `${input.pendingPaymentsCount} ${plural(input.pendingPaymentsCount, 'cobrament pendent', 'cobraments pendents')}`,
      detail: 'Revisa cobraments vençuts i envia recordatoris.',
      href: '/admin/bookings?payment=overdue',
    });
  }

  if (input.staleLeadsCount > 0) {
    alerts.push({
      level: 'WARNING',
      icon: '💤',
      title: `${input.staleLeadsCount} ${plural(input.staleLeadsCount, 'lead estancat', 'leads estancats')}`,
      detail: 'Leads sense moviment recent. Decideix si avançar o tancar.',
      href: '/admin/leads',
    });
  }

  if (input.postEventPending > 0) {
    alerts.push({
      level: 'INFO',
      icon: '📧',
      title: `${input.postEventPending} ${plural(input.postEventPending, 'post-event pendent', 'post-events pendents')}`,
      detail: 'Envia correus de seguiment i demana feedback.',
      href: '/admin/post-event',
    });
  }

  if (input.dormantCustomers > 0) {
    alerts.push({
      level: 'INFO',
      icon: '😴',
      title: `${input.dormantCustomers} ${plural(input.dormantCustomers, 'client dormant', 'clients dormants')}`,
      detail: 'Reactivació disponible amb missatges personalitzats.',
      href: '/admin/clientes/reactivation',
    });
  }

  if (input.atRiskCustomers > 0) {
    alerts.push({
      level: 'WARNING',
      icon: '⚠️',
      title: `${input.atRiskCustomers} ${plural(input.atRiskCustomers, 'client en risc', 'clients en risc')}`,
      detail: "Health score baix. Contacta'ls aviat.",
      href: '/admin/clientes?segment=at-risk',
    });
  }

  if (input.repliedLeadsAwaitingAction > 0) {
    alerts.push({
      level: 'WARNING',
      icon: '↩️',
      title: buildReplyAlertTitle(input.repliedLeadsAwaitingAction),
      detail: "El client ja ha contestat. L'automatització està aturada i ara toca resposta humana.",
      href: '/admin/inbox',
    });
  }

  if (input.urgentFollowUps > 0) {
    alerts.push({
      level: 'CRITICAL',
      icon: '📩',
      title: `${input.urgentFollowUps} ${plural(input.urgentFollowUps, 'seguiment urgent', 'seguiments urgents')}`,
      detail: 'Leads esperant resposta fa +5 dies.',
      href: '/admin/inbox',
    });
  } else if (input.pendingFollowUps > 0) {
    alerts.push({
      level: 'INFO',
      icon: '📩',
      title: `${input.pendingFollowUps} ${plural(input.pendingFollowUps, 'seguiment pendent', 'seguiments pendents')}`,
      detail: 'Respostes pendents al pipeline.',
      href: '/admin/inbox',
    });
  }

  if (input.pipelineHotUncontacted > 0) {
    alerts.push({
      level: 'WARNING',
      icon: '🔥',
      title: `${input.pipelineHotUncontacted} ${plural(input.pipelineHotUncontacted, 'lead calent', 'leads calents')} sense contactar`,
      detail: 'Entrades noves fa +4h sense resposta.',
      href: '/admin/leads?status=NEW',
    });
  }

  if (input.pipelineQuoteNoReply > 0) {
    alerts.push({
      level: 'INFO',
      icon: '📋',
      title: `${input.pipelineQuoteNoReply} ${plural(input.pipelineQuoteNoReply, 'pressupost', 'pressupostos')} sense resposta`,
      detail: 'Pressupostos enviats fa +3 dies sense confirmació.',
      href: '/admin/leads?status=QUOTE_SENT',
    });
  }

  if (input.pipelineEventSoonNoBooking > 0) {
    alerts.push({
      level: 'WARNING',
      icon: '📅',
      title: `${input.pipelineEventSoonNoBooking} ${plural(input.pipelineEventSoonNoBooking, 'event proper', 'events propers')} sense reserva`,
      detail: "Leads amb data d'event <30 dies i sense booking.",
      href: '/admin/leads',
    });
  }

  if (isLeadDrought) {
    actions.push({ priority: 200, label: 'Executar pla de captació', detail: 'Captació aturada. Obre el manual i ataca Fase 0/1.', href: '/admin/manual' });
  } else if (isLeadFamine) {
    actions.push({ priority: 150, label: 'Reforçar canals de captació', detail: `Només ${input.leadsLast7d} leads en 7 dies. Mira el pla al manual.`, href: '/admin/manual' });
  }

  if (input.slaBroken > 0) {
    actions.push({ priority: 100, label: 'Respondre entrades urgents', detail: `${input.slaBroken} entrades sense resposta`, href: '/admin/leads?status=NEW' });
  }

  if (input.repliedLeadsAwaitingAction > 0) {
    actions.push({ priority: 97, label: 'Respondre converses amb resposta', detail: `${input.repliedLeadsAwaitingAction} esperant acció humana`, href: '/admin/inbox' });
  }

  if (input.urgentFollowUps > 0) {
    actions.push({ priority: 95, label: 'Respondre seguiments urgents', detail: `${input.urgentFollowUps} fa +5 dies`, href: '/admin/inbox' });
  } else if (input.pendingFollowUps > 0) {
    actions.push({ priority: 55, label: 'Revisar seguiments pendents', detail: `${input.pendingFollowUps} pendents`, href: '/admin/inbox' });
  }

  if (input.pipelineHotUncontacted > 0) {
    actions.push({ priority: 92, label: 'Contactar leads calents', detail: `${input.pipelineHotUncontacted} sense contactar`, href: '/admin/leads?status=NEW' });
  }

  if (input.newLeadsToday > 0) {
    actions.push({ priority: 90, label: 'Classificar entrades noves', detail: `${input.newLeadsToday} noves avui`, href: '/admin/leads' });
  }

  if (input.overdueTasksCount > 0) {
    actions.push({ priority: 85, label: 'Tancar tasques vençudes', detail: `${input.overdueTasksCount} tasques`, href: '/admin/tasks' });
  }

  if (input.pendingPaymentsCount > 0) {
    actions.push({ priority: 80, label: 'Cobrar pagaments pendents', detail: `${input.pendingPaymentsCount} pendents`, href: '/admin/bookings?payment=overdue' });
  }

  if (input.pipelineEventSoonNoBooking > 0) {
    actions.push({ priority: 75, label: 'Tancar events propers', detail: `${input.pipelineEventSoonNoBooking} sense reserva`, href: '/admin/leads' });
  }

  if (input.upcomingBookings7d > 0) {
    actions.push({ priority: 70, label: 'Preparar reserves properes', detail: `${input.upcomingBookings7d} en 7 dies`, href: '/admin/bookings' });
  }

  if (input.openLeads > 5) {
    actions.push({ priority: 60, label: 'Revisar embut comercial', detail: `${input.openLeads} leads oberts`, href: '/admin/sales-ops' });
  }

  if (input.postEventPending > 0) {
    actions.push({ priority: 50, label: 'Completar post-event', detail: `${input.postEventPending} pendents`, href: '/admin/post-event' });
  }

  if (input.socialContent) {
    const { daysSinceLastPost, isActive, draftsPending } = input.socialContent;
    if (daysSinceLastPost !== null && daysSinceLastPost > 30) {
      alerts.push({
        level: 'WARNING',
        icon: '📱',
        title: `Canal social aturat: ${daysSinceLastPost} dies sense publicar`,
        detail: "La visibilitat orgànica s'erosiona. Publica contingut per mantenir presència.",
        href: '/admin/social',
      });
      actions.push({ priority: 45, label: 'Reactivar canal social', detail: `${daysSinceLastPost} dies sense publicar`, href: '/admin/social' });
    } else if (daysSinceLastPost !== null && daysSinceLastPost > 14) {
      alerts.push({
        level: 'INFO',
        icon: '📱',
        title: `Canal social inactiu: ${daysSinceLastPost} dies sense publicar`,
        detail: draftsPending > 0
          ? `${draftsPending} ${plural(draftsPending, 'esborrany pendent', 'esborranys pendents')} de publicació.`
          : 'Crea i publica contingut nou per mantenir visibilitat.',
        href: '/admin/social',
      });
      actions.push({ priority: 35, label: 'Publicar contingut social', detail: `${daysSinceLastPost} dies sense publicar`, href: '/admin/social' });
    } else if (daysSinceLastPost === null && !isActive && isLeadDrought) {
      actions.push({ priority: 40, label: 'Iniciar canal social', detail: 'Cap post publicat. El social és el canal gratuït de Fase 1.', href: '/admin/social' });
    }
  }

  actions.sort((a, b) => b.priority - a.priority);

  const topCampaigns = input.campaigns
    .filter((campaign) => campaign.audienceSize > 0)
    .slice(0, 3)
    .map((campaign) => ({
      name: campaign.name,
      type: campaign.type,
      audienceSize: campaign.audienceSize,
      urgency: campaign.urgency,
    }));

  return {
    date: input.now.toISOString().slice(0, 10),
    greeting: getGreeting(input.now.getHours()),
    summary: buildSummary(input),
    kpis: {
      newLeadsToday: input.newLeadsToday,
      openLeads: input.openLeads,
      overdueTasksCount: input.overdueTasksCount,
      upcomingBookings7d: input.upcomingBookings7d,
      pendingPaymentsCount: input.pendingPaymentsCount,
      forecastWeighted: input.forecastWeighted,
    },
    alerts,
    actions,
    topCampaigns,
    socialContent: input.socialContent ?? null,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadDailyBrief(now: Date = new Date()): Promise<DailyBrief> {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const weekAhead = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    socialPulse,
    newLeadsToday,
    openLeads,
    overdueTasksCount,
    upcomingBookings7d,
    pendingPaymentsCount,
    slaBroken,
    staleLeadsCount,
    postEventPending,
    dormantCustomers,
    atRiskCustomers,
    forecastData,
    pendingFollowUpSummary,
    pipelineSuggestions,
    repliedLeadsAwaitingActionLeads,
    leadsLast7d,
    leadsLast30d,
    total,
    withEvents,
    recentMonth,
    vip,
    dormant,
    atRisk,
    highValue,
    firstTime,
    returning,
  ] = await Promise.all([
    loadSocialContentPulse(),
    prisma.lead.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    prisma.lead.count({ where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } } }),
    prisma.task.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { lt: todayStart } } }),
    prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] }, eventDate: { gte: todayStart, lt: weekAhead } } }),
    prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, remainingPaid: false, eventDate: { lt: todayStart } } }),
    prisma.lead.count({ where: { status: 'NEW', createdAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
    prisma.lead.count({ where: { status: { in: ['NEW', 'CONTACTED'] }, updatedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.booking.count({ where: { status: 'COMPLETED', postEventEmailSent: false, eventDate: { lt: todayStart } } }),
    prisma.customer.count({ where: { lifecycleStage: 'DORMANT' } }),
    prisma.customer.count({ where: { healthScore: { lte: 40 } } }),
    prisma.lead.findMany({
      where: { status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] } },
      select: { budget: true, eventType: true, status: true },
      take: 500,
    }),
    loadPendingFollowUps(now, 200),
    loadPipelineSuggestions(now),
    prisma.lead.findMany({
      where: {
        status: { in: ['CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
        contactedAt: { not: null },
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        activities: {
          where: { type: { in: ['EMAIL', 'WHATSAPP'] } },
          select: { createdAt: true, metadata: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      take: 200,
    }),
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { totalEvents: { gt: 0 } } }),
    prisma.customer.count({ where: { createdAt: { gt: oneMonthAgo } } }),
    prisma.customer.count({ where: { lifecycleStage: 'VIP' } }),
    prisma.customer.count({ where: { lifecycleStage: 'DORMANT' } }),
    prisma.customer.count({ where: { healthScore: { lte: 40 } } }),
    prisma.customer.count({ where: { totalSpent: { gte: 2000 } } }),
    prisma.customer.count({ where: { lifecycleStage: 'FIRST_TIME' } }),
    prisma.customer.count({ where: { lifecycleStage: 'RETURNING' } }),
  ]);

  const forecastWeighted = forecastData.reduce((sum, lead) => {
    const budget = parseBudgetValue(lead.budget);
    const prob = LEAD_SCORING_STATUS_PROBABILITY[lead.status] ?? 0.15;
    return sum + budget * prob;
  }, 0);

  const pendingFollowUps = pendingFollowUpSummary.total;
  const urgentFollowUps = pendingFollowUpSummary.urgent;
  const pipelineHotUncontacted = pipelineSuggestions.find((suggestion) => suggestion.type === 'HOT_UNCONTACTED')?.count ?? 0;
  const pipelineQuoteNoReply = pipelineSuggestions.find((suggestion) => suggestion.type === 'QUOTE_NO_REPLY')?.count ?? 0;
  const pipelineEventSoonNoBooking = pipelineSuggestions.find((suggestion) => suggestion.type === 'EVENT_SOON_NO_BOOKING')?.count ?? 0;

  const repliedLeadsAwaitingAction = repliedLeadsAwaitingActionLeads.filter((lead) => {
    const responseState = deriveLeadResponseState(lead.activities, lead.createdAt);

    return Boolean(
      responseState.lastInboundAt &&
      responseState.lastOutboundAt &&
      responseState.lastInboundAt > responseState.lastOutboundAt &&
      lead.updatedAt < responseState.lastInboundAt,
    );
  }).length;

  const campaigns = generateCampaigns({
    segments: { dormant, atRisk, vip, highValue, firstTime, returning, withEvents, recentMonth, total },
    now,
  });

  return generateDailyBrief({
    newLeadsToday,
    openLeads,
    overdueTasksCount,
    upcomingBookings7d,
    pendingPaymentsCount,
    forecastWeighted,
    slaBroken,
    staleLeadsCount,
    postEventPending,
    dormantCustomers,
    atRiskCustomers,
    campaigns,
    pendingFollowUps,
    urgentFollowUps,
    repliedLeadsAwaitingAction,
    pipelineHotUncontacted,
    pipelineQuoteNoReply,
    pipelineEventSoonNoBooking,
    leadsLast7d,
    leadsLast30d,
    now,
    socialContent: {
      daysSinceLastPost: socialPulse.daysSinceLastPost,
      isActive: socialPulse.isActive,
      consistencyScore: socialPulse.consistencyScore,
      draftsPending: socialPulse.draftsPending,
      scheduledUpcoming: socialPulse.scheduledUpcoming,
    },
  });
}
