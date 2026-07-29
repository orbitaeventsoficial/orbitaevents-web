// Recomanacions internes de pressupostos en esborrany. No desa, no envia i no
// genera PDFs: només prioritza DRAFT vius perquè el propietari obri l'Studio
// canònic i decideixi si cal previsualitzar, enviar o netejar.

import { ProposalStatus } from '@prisma/client';
import { buildCustomerProposalHref } from '@/lib/admin/customerWorkspaceHref';
import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

export type ProposalDraftSuggestionBand = 'ALTA' | 'MITJANA' | 'BAIXA';

export type ProposalDraftInput = {
  id: string;
  reference: string;
  customerId: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  status: string;
  total: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  sentAt?: Date | string | null;
  customer?: { name: string | null; email?: string | null } | null;
  lead?: { name?: string | null; eventDate?: Date | string | null } | null;
  booking?: { clientName?: string | null; eventDate?: Date | string | null; reference?: string | null } | null;
};

export type ProposalDraftSuggestion = {
  proposalId: string;
  reference: string;
  customerId: string;
  leadId: string | null;
  bookingId: string | null;
  name: string;
  total: number;
  score: number;
  band: ProposalDraftSuggestionBand;
  href: string;
  reasons: string[];
  daysSinceUpdated: number;
  daysUntilEvent: number | null;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysSince(date: Date | null, now: Date): number {
  if (!date) return 0;
  return Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS));
}

function daysUntil(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.ceil((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

function eventDateFor(proposal: ProposalDraftInput): Date | null {
  return toDate(proposal.booking?.eventDate ?? proposal.lead?.eventDate ?? null);
}

function ageScore(daysSinceUpdated: number): number {
  if (daysSinceUpdated >= 14) return 24;
  if (daysSinceUpdated >= 7) return 18;
  if (daysSinceUpdated >= 2) return 8;
  return 2;
}

function eventScore(daysUntilEvent: number | null): number {
  if (daysUntilEvent === null) return 0;
  if (daysUntilEvent <= 7) return 40;
  if (daysUntilEvent <= 14) return 30;
  if (daysUntilEvent <= 30) return 12;
  return 0;
}

function valueScore(total: number): number {
  if (total >= 1000) return 8;
  if (total >= 500) return 5;
  return 0;
}

function bandForScore(score: number): ProposalDraftSuggestionBand {
  if (score >= 85) return 'ALTA';
  if (score >= 62) return 'MITJANA';
  return 'BAIXA';
}

function fallbackStudioHref(proposalId: string): string {
  const params = new URLSearchParams({ proposalId });
  return `/admin/presupuestos?${params.toString()}`;
}

function nameForProposal(proposal: ProposalDraftInput): string {
  return proposal.customer?.name
    || proposal.booking?.clientName
    || proposal.lead?.name
    || proposal.reference;
}

function reasonsForProposal(
  proposal: ProposalDraftInput,
  daysSinceUpdated: number,
  daysUntilEvent: number | null,
): string[] {
  const reasons: string[] = ['Pressupost en esborrany'];
  if (daysUntilEvent !== null && daysUntilEvent <= 30) reasons.push('Data propera');
  if (daysSinceUpdated === 0) reasons.push('Actualitzat avui');
  if (daysSinceUpdated > 0) reasons.push(`${daysSinceUpdated} ${daysSinceUpdated === 1 ? 'dia' : 'dies'} sense enviar`);
  if (proposal.leadId || proposal.bookingId) reasons.push('Bolo vinculat');
  if (proposal.customerId) reasons.push('Client assignat');
  return reasons.slice(0, 4);
}

export function rankProposalDraftSuggestions(
  proposals: ProposalDraftInput[],
  limit = 3,
  now: Date = new Date(),
): ProposalDraftSuggestion[] {
  return proposals
    .map((proposal) => {
      if (proposal.status !== 'DRAFT') return null;
      if (!proposal.customerId) return null;
      if (proposal.sentAt) return null;

      const eventDate = eventDateFor(proposal);
      const eventDays = daysUntil(eventDate, now);
      if (eventDays !== null && eventDays < 0) return null;

      const updatedDays = daysSince(toDate(proposal.updatedAt) ?? toDate(proposal.createdAt), now);
      const linkedScore = proposal.leadId || proposal.bookingId ? 8 : 0;
      const score = 58
        + ageScore(updatedDays)
        + eventScore(eventDays)
        + linkedScore
        + valueScore(proposal.total);

      return {
        proposalId: proposal.id,
        reference: proposal.reference,
        customerId: proposal.customerId,
        leadId: proposal.leadId ?? null,
        bookingId: proposal.bookingId ?? null,
        name: nameForProposal(proposal),
        total: proposal.total,
        score,
        band: bandForScore(score),
        href: proposal.customerId
          ? buildCustomerProposalHref(proposal.customerId, proposal.id)
          : fallbackStudioHref(proposal.id),
        reasons: reasonsForProposal(proposal, updatedDays, eventDays),
        daysSinceUpdated: updatedDays,
        daysUntilEvent: eventDays,
      };
    })
    .filter((item): item is ProposalDraftSuggestion => Boolean(item))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.daysUntilEvent !== b.daysUntilEvent) {
        if (a.daysUntilEvent === null) return 1;
        if (b.daysUntilEvent === null) return -1;
        return a.daysUntilEvent - b.daysUntilEvent;
      }
      return a.reference.localeCompare(b.reference);
    })
    .slice(0, Math.max(0, limit));
}

export async function loadProposalDraftSuggestions(limit = 3, now: Date = new Date()): Promise<ProposalDraftSuggestion[]> {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: ProposalStatus.DRAFT,
      customerId: { not: null },
      sentAt: null,
    },
    select: {
      id: true,
      reference: true,
      customerId: true,
      leadId: true,
      bookingId: true,
      status: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      sentAt: true,
      customer: { select: { name: true, email: true } },
      lead: { select: { name: true, eventDate: true } },
      booking: { select: { clientName: true, eventDate: true, reference: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 200,
  });

  return rankProposalDraftSuggestions(proposals, limit, now);
}
