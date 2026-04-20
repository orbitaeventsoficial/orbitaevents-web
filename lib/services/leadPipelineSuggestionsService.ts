// lib/services/leadPipelineSuggestionsService.ts
// ═══════════════════════════════════════════════════════════════════════════
// LEAD PIPELINE SUGGESTIONS SERVICE
// Analitza el pipeline comercial sencer i genera suggeriments accionables
// per prioritzar feina. Part pura + wrapper Prisma.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type SuggestionType =
  | 'HOT_UNCONTACTED'
  | 'STALE_NEGOTIATION'
  | 'QUOTE_NO_REPLY'
  | 'EVENT_SOON_NO_BOOKING'
  | 'HIGH_VALUE_IDLE'
  | 'BULK_NEW_LEADS'
  | 'WINNING_STREAK';

export type SuggestionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export interface PipelineSuggestion {
  type: SuggestionType;
  priority: SuggestionPriority;
  icon: string;
  title: string;
  detail: string;
  href: string;
  leadIds: string[];
  count: number;
}

export type PipelineSuggestionsInput = {
  leads: Array<{
    id: string;
    name: string;
    status: string;
    priority: string;
    createdAt: Date;
    contactedAt: Date | null;
    updatedAt: Date;
    eventDate: Date | null;
    guestCount: number | null;
    budget: string | null;
    hasBooking: boolean;
    lastActivityAt: Date | null;
    nurturingStep: number;
  }>;
  recentWonCount: number;
  now: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(ref: Date | null, now: Date): number | null {
  if (!ref) return null;
  return Math.floor((now.getTime() - ref.getTime()) / DAY_MS);
}

function daysUntil(ref: Date | null, now: Date): number | null {
  if (!ref) return null;
  return Math.ceil((ref.getTime() - now.getTime()) / DAY_MS);
}

function estimateBudget(budget: string | null): number {
  if (!budget) return 0;
  const num = Number(budget.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(num) ? num : 0;
}

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generatePipelineSuggestions(input: PipelineSuggestionsInput): PipelineSuggestion[] {
  const suggestions: PipelineSuggestion[] = [];
  const { leads, now } = input;

  // 1. HOT_UNCONTACTED — Leads NEW amb >4h sense contactar
  const hotUncontacted = leads.filter((l) => {
    if (l.status !== 'NEW') return false;
    const hours = (now.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60);
    return hours >= 4 && !l.contactedAt;
  });
  if (hotUncontacted.length > 0) {
    const oldest = hotUncontacted.reduce((a, b) => a.createdAt < b.createdAt ? a : b);
    const hoursOld = Math.floor((now.getTime() - oldest.createdAt.getTime()) / (1000 * 60 * 60));
    suggestions.push({
      type: 'HOT_UNCONTACTED',
      priority: 'CRITICAL',
      icon: '🔥',
      title: `${hotUncontacted.length} entrada${hotUncontacted.length > 1 ? 'es' : ''} sense contactar`,
      detail: `La més antiga fa ${hoursOld}h. Cada hora que passa, la probabilitat de conversió baixa.`,
      href: '/admin/leads?status=NEW',
      leadIds: hotUncontacted.map((l) => l.id),
      count: hotUncontacted.length,
    });
  }

  // 2. STALE_NEGOTIATION — Leads NEGOTIATING sense activitat >5 dies
  const staleNegotiation = leads.filter((l) => {
    if (l.status !== 'NEGOTIATING') return false;
    const days = daysSince(l.lastActivityAt || l.updatedAt, now);
    return days != null && days >= 5;
  });
  if (staleNegotiation.length > 0) {
    suggestions.push({
      type: 'STALE_NEGOTIATION',
      priority: 'HIGH',
      icon: '⏳',
      title: `${staleNegotiation.length} negociació${staleNegotiation.length > 1 ? 'ns' : ''} estancada${staleNegotiation.length > 1 ? 'es' : ''}`,
      detail: 'Leads en negociació sense moviment des de fa 5+ dies. Envia un seguiment o tanca.',
      href: '/admin/leads?status=NEGOTIATING',
      leadIds: staleNegotiation.map((l) => l.id),
      count: staleNegotiation.length,
    });
  }

  // 3. QUOTE_NO_REPLY — Leads QUOTE_SENT sense activitat >3 dies
  const quoteNoReply = leads.filter((l) => {
    if (l.status !== 'QUOTE_SENT') return false;
    const days = daysSince(l.lastActivityAt || l.updatedAt, now);
    return days != null && days >= 3;
  });
  if (quoteNoReply.length > 0) {
    suggestions.push({
      type: 'QUOTE_NO_REPLY',
      priority: 'HIGH',
      icon: '💰',
      title: `${quoteNoReply.length} pressupost${quoteNoReply.length > 1 ? 's' : ''} sense resposta`,
      detail: 'Pressupostos enviats fa 3+ dies sense resposta. Fes seguiment per tancar.',
      href: '/admin/leads?status=QUOTE_SENT',
      leadIds: quoteNoReply.map((l) => l.id),
      count: quoteNoReply.length,
    });
  }

  // 4. EVENT_SOON_NO_BOOKING — Leads amb event <30d i sense booking
  const eventSoon = leads.filter((l) => {
    if (l.hasBooking) return false;
    if (l.status === 'LOST' || l.status === 'WON') return false;
    const days = daysUntil(l.eventDate, now);
    return days != null && days >= 0 && days <= 30;
  });
  if (eventSoon.length > 0) {
    const closest = eventSoon.reduce((a, b) => {
      const da = daysUntil(a.eventDate, now) ?? 999;
      const db = daysUntil(b.eventDate, now) ?? 999;
      return da < db ? a : b;
    });
    const daysLeft = daysUntil(closest.eventDate, now) ?? 0;
    suggestions.push({
      type: 'EVENT_SOON_NO_BOOKING',
      priority: daysLeft <= 14 ? 'CRITICAL' : 'HIGH',
      icon: '📅',
      title: `${eventSoon.length} event${eventSoon.length > 1 ? 's' : ''} en <30d sense reserva`,
      detail: `El més proper és en ${daysLeft} dies (${closest.name}). Tanca la reserva o es perdrà.`,
      href: '/admin/leads',
      leadIds: eventSoon.map((l) => l.id),
      count: eventSoon.length,
    });
  }

  // 5. HIGH_VALUE_IDLE — Leads amb budget >2000€ i inactius >3d
  const highValueIdle = leads.filter((l) => {
    if (l.status === 'LOST' || l.status === 'WON') return false;
    const value = estimateBudget(l.budget);
    if (value < 2000) return false;
    const days = daysSince(l.lastActivityAt || l.updatedAt, now);
    return days != null && days >= 3;
  });
  if (highValueIdle.length > 0) {
    suggestions.push({
      type: 'HIGH_VALUE_IDLE',
      priority: 'HIGH',
      icon: '💎',
      title: `${highValueIdle.length} lead${highValueIdle.length > 1 ? 's' : ''} d'alt valor inactiu${highValueIdle.length > 1 ? 's' : ''}`,
      detail: 'Leads amb pressupost >2.000€ sense activitat recent. Prioritza el contacte.',
      href: '/admin/leads',
      leadIds: highValueIdle.map((l) => l.id),
      count: highValueIdle.length,
    });
  }

  // 6. BULK_NEW_LEADS — Si hi ha ≥5 leads NEW d'avui
  const todayNew = leads.filter((l) => {
    if (l.status !== 'NEW') return false;
    const days = daysSince(l.createdAt, now);
    return days != null && days < 1;
  });
  if (todayNew.length >= 5) {
    suggestions.push({
      type: 'BULK_NEW_LEADS',
      priority: 'MEDIUM',
      icon: '📊',
      title: `${todayNew.length} entrades noves avui`,
      detail: 'Volum alt d\'entrades. Considera blocs de trucades per optimitzar conversió.',
      href: '/admin/leads?status=NEW',
      leadIds: todayNew.map((l) => l.id),
      count: todayNew.length,
    });
  }

  // 7. WINNING_STREAK — Si hi ha ≥3 WON en els últims 7 dies (positiu)
  if (input.recentWonCount >= 3) {
    suggestions.push({
      type: 'WINNING_STREAK',
      priority: 'INFO',
      icon: '🏆',
      title: `${input.recentWonCount} conversions en 7 dies`,
      detail: 'Bona ratxa comercial. Aprofita el momentum per tancar les negociacions obertes.',
      href: '/admin/leads?status=NEGOTIATING',
      leadIds: [],
      count: input.recentWonCount,
    });
  }

  // Ordenar per prioritat
  const order: Record<SuggestionPriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, INFO: 3 };
  suggestions.sort((a, b) => order[a.priority] - order[b.priority]);

  return suggestions;
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadPipelineSuggestions(
  now: Date = new Date()
): Promise<PipelineSuggestion[]> {
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [leads, recentWonCount] = await Promise.all([
    prisma.lead.findMany({
      where: {
        status: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING'] },
      },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        createdAt: true,
        contactedAt: true,
        updatedAt: true,
        eventDate: true,
        guestCount: true,
        budget: true,
        nurturingStep: true,
        booking: { select: { id: true } },
        activities: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.lead.count({
      where: {
        status: 'WON',
        convertedAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  return generatePipelineSuggestions({
    leads: leads.map((l) => ({
      id: l.id,
      name: l.name,
      status: l.status,
      priority: l.priority,
      createdAt: l.createdAt,
      contactedAt: l.contactedAt,
      updatedAt: l.updatedAt,
      eventDate: l.eventDate,
      guestCount: l.guestCount,
      budget: l.budget,
      hasBooking: l.booking != null,
      lastActivityAt: l.activities[0]?.createdAt ?? null,
      nurturingStep: l.nurturingStep,
    })),
    recentWonCount,
    now,
  });
}
