// lib/services/attributionService.ts
// ═══════════════════════════════════════════════════════════════════════════
// ATTRIBUTION SERVICE
// Analitza els leads per source + utmSource + utmCampaign + landingPage
// per saber quins canals funcionen realment.
// Conté dos models:
//   1. Single-touch (last-touch) — el source amb què s'ha capturat el lead.
//   2. Multi-touch — primer touch + assists + last touch usant LeadActivity.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import type { LeadSource, LeadStatus } from '@prisma/client';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type AttributionBucket = {
  key: string;
  label: string;
  leads: number;
  won: number;
  lost: number;
  open: number;
  conversionRate: number; // won / (won + lost), 0..1
  revenue: number; // sum of booking totals for won leads
};

export type AttributionReport = {
  generatedAt: string;
  windowDays: number;
  totalLeads: number;
  bySource: AttributionBucket[];
  byUtmSource: AttributionBucket[];
  byUtmCampaign: AttributionBucket[];
  byLandingPage: AttributionBucket[];
  topPerformer: {
    source: AttributionBucket | null;
    campaign: AttributionBucket | null;
    landing: AttributionBucket | null;
  };
  verdict: string;
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export type AttributionLeadInput = {
  source: LeadSource;
  status: LeadStatus;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  revenue: number; // 0 if no booking/not won
};

const SOURCE_LABELS: Record<LeadSource, string> = {
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

function aggregate(
  leads: AttributionLeadInput[],
  keyFn: (l: AttributionLeadInput) => string | null,
  labelFn: (k: string) => string = (k) => k,
): AttributionBucket[] {
  const map = new Map<string, AttributionBucket>();
  for (const lead of leads) {
    const key = keyFn(lead);
    if (!key) continue;
    const existing = map.get(key) || {
      key,
      label: labelFn(key),
      leads: 0,
      won: 0,
      lost: 0,
      open: 0,
      conversionRate: 0,
      revenue: 0,
    };
    existing.leads += 1;
    if (lead.status === 'WON') {
      existing.won += 1;
      existing.revenue += lead.revenue;
    } else if (lead.status === 'LOST') {
      existing.lost += 1;
    } else {
      existing.open += 1;
    }
    map.set(key, existing);
  }
  const buckets = Array.from(map.values());
  for (const b of buckets) {
    const closed = b.won + b.lost;
    b.conversionRate = closed > 0 ? b.won / closed : 0;
  }
  buckets.sort((a, b) => b.leads - a.leads);
  return buckets;
}

export function generateAttributionReport(
  leads: AttributionLeadInput[],
  windowDays: number,
  now: Date,
): AttributionReport {
  const bySource = aggregate(
    leads,
    (l) => l.source,
    (k) => SOURCE_LABELS[k as LeadSource] || k,
  );
  const byUtmSource = aggregate(leads, (l) => l.utmSource);
  const byUtmCampaign = aggregate(leads, (l) => l.utmCampaign);
  const byLandingPage = aggregate(leads, (l) => l.landingPage);

  // Top performer = més won (amb desempat per revenue)
  const rankByPerformance = (a: AttributionBucket, b: AttributionBucket) => {
    if (b.won !== a.won) return b.won - a.won;
    return b.revenue - a.revenue;
  };
  const topSource = [...bySource].sort(rankByPerformance)[0] || null;
  const topCampaign = [...byUtmCampaign].sort(rankByPerformance)[0] || null;
  const topLanding = [...byLandingPage].sort(rankByPerformance)[0] || null;

  let verdict: string;
  if (leads.length === 0) {
    verdict = 'Sense leads en el període. Cal activar canals de captació.';
  } else if (topSource && topSource.won === 0) {
    verdict = `${leads.length} leads però cap tancat. Revisa el procés comercial: els canals porten trànsit però no converteixen.`;
  } else if (topSource) {
    const pct = Math.round((topSource.leads / leads.length) * 100);
    verdict = `Canal principal: ${topSource.label} (${pct}% dels leads, ${topSource.won} guanyats). ${topCampaign?.key ? `Campanya destacada: ${topCampaign.key}.` : 'Sense dades de campanya UTM.'}`;
  } else {
    verdict = 'Dades insuficients per atribució.';
  }

  return {
    generatedAt: now.toISOString(),
    windowDays,
    totalLeads: leads.length,
    bySource,
    byUtmSource,
    byUtmCampaign,
    byLandingPage,
    topPerformer: {
      source: topSource,
      campaign: topCampaign,
      landing: topLanding,
    },
    verdict,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// MULTI-TOUCH ATTRIBUTION — TYPES
// ───────────────────────────────────────────────────────────────────────────

/** Canals de comunicació que compten com a touchpoint (assist o last-touch). */
const COMM_ACTIVITY_TYPES = new Set(['EMAIL', 'CALL', 'WHATSAPP', 'NOTE']);

const CHANNEL_LABELS: Record<string, string> = {
  ...SOURCE_LABELS,
  EMAIL: 'Email',
  CALL: 'Trucada',
  WHATSAPP: 'WhatsApp',
  NOTE: 'Nota',
};

export type JourneyTouchpoint = {
  channel: string;
  label: string;
  timestamp: string; // ISO
};

export type LeadJourney = {
  leadId: string;
  status: string;
  revenue: number;
  firstTouch: JourneyTouchpoint;
  assists: JourneyTouchpoint[];
  lastTouch: JourneyTouchpoint | null;
  touchpointCount: number;
};

export type ChannelCredit = {
  channel: string;
  label: string;
  firstTouchCount: number;
  assistCount: number;
  lastTouchCount: number;
  firstTouchRevenue: number;
  lastTouchRevenue: number;
  totalTouchpoints: number;
};

export type MultiTouchReport = {
  generatedAt: string;
  windowDays: number;
  totalLeads: number;
  wonLeads: number;
  journeys: LeadJourney[];
  byChannel: ChannelCredit[];
  insights: string[];
  verdict: string;
};

// ───────────────────────────────────────────────────────────────────────────
// MULTI-TOUCH — PURE INPUT
// ───────────────────────────────────────────────────────────────────────────

export type MultiTouchActivityInput = {
  type: string; // LeadActivityType
  createdAt: Date;
};

export type MultiTouchLeadInput = {
  id: string;
  source: string; // LeadSource
  status: string; // LeadStatus
  revenue: number;
  createdAt: Date;
  activities: MultiTouchActivityInput[];
};

// ───────────────────────────────────────────────────────────────────────────
// MULTI-TOUCH — PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

function buildJourney(lead: MultiTouchLeadInput): LeadJourney {
  const firstTouch: JourneyTouchpoint = {
    channel: lead.source,
    label: CHANNEL_LABELS[lead.source] || lead.source,
    timestamp: lead.createdAt.toISOString(),
  };

  // Filter comm activities, sort chronologically
  const commActivities = lead.activities
    .filter((a) => COMM_ACTIVITY_TYPES.has(a.type))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const assists: JourneyTouchpoint[] = commActivities.map((a) => ({
    channel: a.type,
    label: CHANNEL_LABELS[a.type] || a.type,
    timestamp: a.createdAt.toISOString(),
  }));

  // Last touch = last comm activity (if any), distinct from first touch
  let lastTouch: JourneyTouchpoint | null = null;
  if (assists.length > 0) {
    lastTouch = assists[assists.length - 1];
    // Remove last from assists to avoid double-counting
    assists.pop();
  }

  return {
    leadId: lead.id,
    status: lead.status,
    revenue: lead.revenue,
    firstTouch,
    assists,
    lastTouch,
    touchpointCount: 1 + assists.length + (lastTouch ? 1 : 0),
  };
}

export function generateMultiTouchReport(
  leads: MultiTouchLeadInput[],
  windowDays: number,
  now: Date,
): MultiTouchReport {
  const wonLeads = leads.filter((l) => l.status === 'WON');
  const journeys = wonLeads.map(buildJourney);

  // Accumulate channel credits from WON journeys
  const creditMap = new Map<string, ChannelCredit>();

  function ensureChannel(channel: string): ChannelCredit {
    if (!creditMap.has(channel)) {
      creditMap.set(channel, {
        channel,
        label: CHANNEL_LABELS[channel] || channel,
        firstTouchCount: 0,
        assistCount: 0,
        lastTouchCount: 0,
        firstTouchRevenue: 0,
        lastTouchRevenue: 0,
        totalTouchpoints: 0,
      });
    }
    return creditMap.get(channel)!;
  }

  for (const j of journeys) {
    const first = ensureChannel(j.firstTouch.channel);
    first.firstTouchCount += 1;
    first.firstTouchRevenue += j.revenue;
    first.totalTouchpoints += 1;

    for (const a of j.assists) {
      const assist = ensureChannel(a.channel);
      assist.assistCount += 1;
      assist.totalTouchpoints += 1;
    }

    if (j.lastTouch) {
      const last = ensureChannel(j.lastTouch.channel);
      last.lastTouchCount += 1;
      last.lastTouchRevenue += j.revenue;
      last.totalTouchpoints += 1;
    }
  }

  const byChannel = Array.from(creditMap.values()).sort(
    (a, b) => b.totalTouchpoints - a.totalTouchpoints,
  );

  // Insights
  const insights: string[] = [];
  const topFirst = byChannel.reduce((best, c) =>
    c.firstTouchCount > (best?.firstTouchCount ?? 0) ? c : best, byChannel[0] as ChannelCredit | undefined);
  const topLast = byChannel.reduce((best, c) =>
    c.lastTouchCount > (best?.lastTouchCount ?? 0) ? c : best, byChannel[0] as ChannelCredit | undefined);
  const topAssist = byChannel.reduce((best, c) =>
    c.assistCount > (best?.assistCount ?? 0) ? c : best, byChannel[0] as ChannelCredit | undefined);

  if (topFirst && topFirst.firstTouchCount > 0) {
    insights.push(`${topFirst.label} és el canal que més leads porta (${topFirst.firstTouchCount} primers contactes).`);
  }
  if (topAssist && topAssist.assistCount > 0) {
    insights.push(`${topAssist.label} és el canal que més ajuda a mantenir el contacte (${topAssist.assistCount} interaccions d'assist).`);
  }
  if (topLast && topLast.lastTouchCount > 0 && topLast.channel !== topFirst?.channel) {
    insights.push(`${topLast.label} és el canal que tanca més vendes (${topLast.lastTouchCount} últims contactes), diferent del que els porta.`);
  }

  // Verdict
  let verdict: string;
  if (leads.length === 0) {
    verdict = 'Sense leads en el període. Cal activar canals de captació.';
  } else if (wonLeads.length === 0) {
    verdict = `${leads.length} leads però cap guanyat. El journey multi-touch no es pot calcular sense conversions.`;
  } else if (topFirst && topLast && topFirst.channel !== topLast?.channel) {
    verdict = `${topFirst.label} porta els leads, però ${topLast.label} els tanca. Inverteix en ambdós: captació i tancament operen per canals diferents.`;
  } else if (topFirst) {
    verdict = `${topFirst.label} domina tant la captació com el tancament. Canal fort, però diversificar reduiria el risc.`;
  } else {
    verdict = 'Dades insuficients per generar insights multi-touch.';
  }

  return {
    generatedAt: now.toISOString(),
    windowDays,
    totalLeads: leads.length,
    wonLeads: wonLeads.length,
    journeys,
    byChannel,
    insights,
    verdict,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPERS (Prisma)
// ───────────────────────────────────────────────────────────────────────────

export async function loadAttributionReport(windowDays = 90, now: Date = new Date()): Promise<AttributionReport> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
    select: {
      source: true,
      status: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      landingPage: true,
      booking: {
        select: { total: true, status: true },
      },
    },
  });

  const mapped: AttributionLeadInput[] = leads.map((l) => {
    const bookingActive = l.booking && ['CONFIRMED', 'PREPARING', 'COMPLETED'].includes(l.booking.status);
    return {
      source: l.source,
      status: l.status,
      utmSource: l.utmSource,
      utmMedium: l.utmMedium,
      utmCampaign: l.utmCampaign,
      landingPage: l.landingPage,
      revenue: bookingActive && l.booking?.total ? l.booking.total : 0,
    };
  });

  return generateAttributionReport(mapped, windowDays, now);
}

export async function loadMultiTouchReport(windowDays = 90, now: Date = new Date()): Promise<MultiTouchReport> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true,
      source: true,
      status: true,
      createdAt: true,
      booking: {
        select: { total: true, status: true },
      },
      activities: {
        select: { type: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const mapped: MultiTouchLeadInput[] = leads.map((l) => {
    const bookingActive = l.booking && ['CONFIRMED', 'PREPARING', 'COMPLETED'].includes(l.booking.status);
    return {
      id: l.id,
      source: l.source,
      status: l.status,
      revenue: bookingActive && l.booking?.total ? l.booking.total : 0,
      createdAt: l.createdAt,
      activities: l.activities.map((a) => ({
        type: a.type,
        createdAt: a.createdAt,
      })),
    };
  });

  return generateMultiTouchReport(mapped, windowDays, now);
}
