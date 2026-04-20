// lib/services/responseTrackingService.ts
// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE TRACKING SERVICE
// Detecta leads contactats sense resposta i genera suggeriments de follow-up.
// Part pura + wrapper Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type FollowUpUrgency = 'URGENT' | 'NORMAL' | 'LOW';

export type PendingFollowUp = {
  leadId: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string | null;
  status: string;
  preferredLocale: string;
  contactedAt: Date;
  lastOutboundAt: Date;
  daysSinceOutbound: number;
  outboundCount: number;
  hasInboundAfterOutbound: boolean;
  urgency: FollowUpUrgency;
  suggestedAction: string;
};

export type FollowUpSummary = {
  generatedAt: string;
  total: number;
  urgent: number;
  normal: number;
  low: number;
  items: PendingFollowUp[];
};

export type LeadResponseActivity = {
  createdAt: Date;
  metadata: unknown;
};

export type ResponseTrackingInput = {
  leads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    eventType: string | null;
    status: string;
    preferredLocale: string;
    contactedAt: Date | null;
    lastOutboundAt: Date | null;
    outboundCount: number;
    lastInboundAt: Date | null;
  }>;
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

const DAY_MS = 1000 * 60 * 60 * 24;

export function deriveLeadResponseState(
  activities: LeadResponseActivity[] | null | undefined,
  contactedAt: Date | null
): { lastOutboundAt: Date | null; outboundCount: number; lastInboundAt: Date | null } {
  const safeActivities = activities ?? [];
  const outbound = safeActivities.filter((a) => {
    const meta = a.metadata as Record<string, unknown> | null;
    return !meta?.direction || meta.direction === 'outbound';
  });
  const inbound = safeActivities.filter((a) => {
    const meta = a.metadata as Record<string, unknown> | null;
    return meta?.direction === 'inbound';
  });

  return {
    lastOutboundAt: outbound[0]?.createdAt ?? contactedAt,
    outboundCount: outbound.length || 1,
    lastInboundAt: inbound[0]?.createdAt ?? null,
  };
}

function classifyUrgency(daysSince: number): FollowUpUrgency {
  if (daysSince >= 5) return 'URGENT';
  if (daysSince >= 2) return 'NORMAL';
  return 'LOW';
}

function suggestAction(urgency: FollowUpUrgency, locale: string): string {
  if (locale === 'es') {
    if (urgency === 'URGENT') return 'Llamar o enviar WhatsApp — llevan más de 5 días sin respuesta';
    if (urgency === 'NORMAL') return 'Enviar recordatorio amable por email';
    return 'Esperar un poco más, contacto reciente';
  }
  if (urgency === 'URGENT') return 'Trucar o enviar WhatsApp — porten més de 5 dies sense resposta';
  if (urgency === 'NORMAL') return 'Enviar recordatori amable per email';
  return 'Esperar una mica més, contacte recent';
}

export function detectPendingFollowUps(input: ResponseTrackingInput): FollowUpSummary {
  const items: PendingFollowUp[] = [];

  for (const lead of input.leads) {
    // Necessitem que hagi estat contactat i tingui almenys un outbound
    if (!lead.contactedAt || !lead.lastOutboundAt) continue;

    // Si hi ha un inbound posterior a l'últim outbound, no cal follow-up
    const hasInbound = lead.lastInboundAt != null && lead.lastInboundAt > lead.lastOutboundAt;
    if (hasInbound) continue;

    const daysSinceOutbound = Math.floor(
      (input.now.getTime() - lead.lastOutboundAt.getTime()) / DAY_MS
    );

    // Mínim 1 dia per considerar-ho follow-up pendent
    if (daysSinceOutbound < 1) continue;

    const urgency = classifyUrgency(daysSinceOutbound);

    items.push({
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      eventType: lead.eventType,
      status: lead.status,
      preferredLocale: lead.preferredLocale,
      contactedAt: lead.contactedAt,
      lastOutboundAt: lead.lastOutboundAt,
      daysSinceOutbound,
      outboundCount: lead.outboundCount,
      hasInboundAfterOutbound: false,
      urgency,
      suggestedAction: suggestAction(urgency, lead.preferredLocale),
    });
  }

  // Ordenar per urgència (URGENT > NORMAL > LOW) i dins per dies desc
  const urgencyOrder: Record<FollowUpUrgency, number> = { URGENT: 0, NORMAL: 1, LOW: 2 };
  items.sort((a, b) => {
    const u = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (u !== 0) return u;
    return b.daysSinceOutbound - a.daysSinceOutbound;
  });

  return {
    generatedAt: input.now.toISOString(),
    total: items.length,
    urgent: items.filter((i) => i.urgency === 'URGENT').length,
    normal: items.filter((i) => i.urgency === 'NORMAL').length,
    low: items.filter((i) => i.urgency === 'LOW').length,
    items,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER — carrega dades de Prisma i calcula follow-ups pendents
// ───────────────────────────────────────────────────────────────────────────

export async function loadPendingFollowUps(
  now: Date = new Date(),
  limit = 30
): Promise<FollowUpSummary> {
  // Leads actius contactats
  const leads = await prisma.lead.findMany({
    where: {
      status: { in: ['CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
      contactedAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      status: true,
      preferredLocale: true,
      contactedAt: true,
      activities: {
        where: {
          type: { in: ['EMAIL', 'WHATSAPP'] },
        },
        select: {
          type: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { contactedAt: 'desc' },
    take: 200,
  });

  const input: ResponseTrackingInput = {
    leads: leads.map((lead) => {
      const responseState = deriveLeadResponseState(lead.activities, lead.contactedAt);

      return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        eventType: lead.eventType,
        status: lead.status,
        preferredLocale: lead.preferredLocale,
        contactedAt: lead.contactedAt,
        lastOutboundAt: responseState.lastOutboundAt,
        outboundCount: responseState.outboundCount,
        lastInboundAt: responseState.lastInboundAt,
      };
    }),
    now,
  };

  const result = detectPendingFollowUps(input);
  return {
    ...result,
    items: result.items.slice(0, limit),
  };
}
