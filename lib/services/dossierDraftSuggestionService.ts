// lib/services/dossierDraftSuggestionService.ts
// Recomanacions internes de dossiers a preparar. No crea dossiers, no envia correus
// i no muta cap dada: només prioritza leads oberts sense dossier actiu.

import { OPEN_LEAD_STATUSES } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

type DossierActivity = {
  id: string;
  deletedAt?: Date | string | null;
};

type LeadServiceLineActivity = {
  id?: string;
};

export type DossierDraftLeadInput = {
  id: string;
  name: string;
  status: string;
  priority?: string | null;
  eventDate: Date | string | null;
  updatedAt: Date | string;
  budget?: string | null;
  distanceKm?: number | null;
  dossiers?: DossierActivity[];
  serviceLines?: LeadServiceLineActivity[];
};

export type DossierDraftSuggestionBand = 'ALTA' | 'MITJANA' | 'BAIXA';

export type DossierDraftSuggestion = {
  leadId: string;
  name: string;
  status: string;
  priority: string | null;
  score: number;
  band: DossierDraftSuggestionBand;
  href: string;
  reasons: string[];
  eventDate: Date | null;
  daysUntilEvent: number | null;
  budget: string | null;
  serviceLinesCount: number;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntil(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.ceil((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

function hasActiveDossier(lead: DossierDraftLeadInput): boolean {
  return (lead.dossiers ?? []).some((dossier) => !dossier.deletedAt);
}

function isOpenLead(status: string): boolean {
  return (OPEN_LEAD_STATUSES as readonly string[]).includes(status);
}

function statusScore(status: string): number {
  switch (status) {
    case 'NEGOTIATING': return 36;
    case 'QUOTE_SENT': return 32;
    case 'CONTACTED': return 22;
    case 'NEW': return 10;
    default: return 0;
  }
}

function priorityScore(priority: string | null | undefined): number {
  switch (priority) {
    case 'URGENT': return 14;
    case 'HIGH': return 9;
    case 'MEDIUM': return 3;
    default: return 0;
  }
}

function eventScore(days: number | null): number {
  if (days === null) return 0;
  if (days <= 7) return 24;
  if (days <= 14) return 20;
  if (days <= 30) return 14;
  if (days <= 60) return 7;
  return 0;
}

function bandForScore(score: number): DossierDraftSuggestionBand {
  if (score >= 70) return 'ALTA';
  if (score >= 42) return 'MITJANA';
  return 'BAIXA';
}

export function buildDossierDraftHref(leadId: string): string {
  const params = new URLSearchParams({ leadId });
  return `/admin/dossiers?${params.toString()}`;
}

function reasonsForLead(lead: DossierDraftLeadInput, serviceLinesCount: number, days: number | null): string[] {
  const reasons: string[] = ['Sense dossier actiu'];
  if (serviceLinesCount > 0) reasons.push('Bolo configurat');
  if (lead.status === 'NEGOTIATING') reasons.push('Negociació oberta');
  if (lead.status === 'QUOTE_SENT') reasons.push('Pressupost enviat');
  if (lead.status === 'CONTACTED') reasons.push('Contacte fet');
  if (lead.status === 'NEW') reasons.push('Entrada nova');
  if (days !== null && days <= 30) reasons.push('Data propera');
  if ((lead.distanceKm ?? 0) > 0) reasons.push('Desplaçament calculat');
  return reasons.slice(0, 4);
}

export function rankDossierDraftSuggestions(
  leads: DossierDraftLeadInput[],
  limit = 3,
  now: Date = new Date(),
): DossierDraftSuggestion[] {
  return leads
    .map((lead) => {
      if (!isOpenLead(lead.status) || hasActiveDossier(lead)) return null;

      const eventDate = toDate(lead.eventDate);
      const days = daysUntil(eventDate, now);
      if (days !== null && days < 0) return null;

      const serviceLinesCount = lead.serviceLines?.length ?? 0;
      const serviceLineScore = serviceLinesCount > 0
        ? 26 + Math.min(8, serviceLinesCount * 2)
        : 0;
      const travelScore = (lead.distanceKm ?? 0) > 0 ? 5 : 0;
      const score = statusScore(lead.status)
        + priorityScore(lead.priority)
        + eventScore(days)
        + serviceLineScore
        + travelScore;

      return {
        leadId: lead.id,
        name: lead.name,
        status: lead.status,
        priority: lead.priority ?? null,
        score,
        band: bandForScore(score),
        href: buildDossierDraftHref(lead.id),
        reasons: reasonsForLead(lead, serviceLinesCount, days),
        eventDate,
        daysUntilEvent: days,
        budget: lead.budget ?? null,
        serviceLinesCount,
      };
    })
    .filter((item): item is DossierDraftSuggestion => Boolean(item))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.daysUntilEvent !== b.daysUntilEvent) {
        if (a.daysUntilEvent === null) return 1;
        if (b.daysUntilEvent === null) return -1;
        return a.daysUntilEvent - b.daysUntilEvent;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, Math.max(0, limit));
}

export async function loadDossierDraftSuggestions(limit = 3, now: Date = new Date()): Promise<DossierDraftSuggestion[]> {
  const leads = await prisma.lead.findMany({
    where: {
      status: { in: [...OPEN_LEAD_STATUSES] },
      OR: [
        { eventDate: null },
        { eventDate: { gte: startOfDay(now) } },
      ],
    },
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
      eventDate: true,
      updatedAt: true,
      budget: true,
      distanceKm: true,
      serviceLines: { select: { id: true } },
      dossiers: {
        where: { deletedAt: null },
        select: { id: true, deletedAt: true },
      },
    },
    orderBy: [
      { updatedAt: 'desc' },
    ],
    take: 200,
  });
  return rankDossierDraftSuggestions(leads, limit, now);
}
