// Recomanacions internes per convertir pressupostos acceptats en reserva.
// No crea reserves ni muta dades: només prioritza la feina executiva pendent.

import { ProposalStatus } from '@prisma/client';
import { buildProposalBookingCreateHref } from '@/lib/admin/proposalWorkspaceHref';
import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

export type ProposalBookingConversionSuggestionBand = 'ALTA' | 'MITJANA' | 'BAIXA';

export type ProposalBookingConversionInput = {
  id: string;
  reference: string;
  customerId: string | null;
  leadId?: string | null;
  bookingId?: string | null;
  status: string;
  total: number;
  acceptedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  sentAt?: Date | string | null;
  pdfUrl?: string | null;
  pdfKey?: string | null;
  customer?: { name: string | null; email?: string | null } | null;
  lead?: { name?: string | null; eventDate?: Date | string | null } | null;
};

export type ProposalBookingConversionSuggestion = {
  proposalId: string;
  reference: string;
  customerId: string;
  leadId: string | null;
  name: string;
  total: number;
  score: number;
  band: ProposalBookingConversionSuggestionBand;
  href: string;
  reasons: string[];
  daysSinceAccepted: number;
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

function hasCanonicalSentArtifact(proposal: ProposalBookingConversionInput): boolean {
  return Boolean(proposal.sentAt && proposal.pdfUrl?.trim() && proposal.pdfKey?.trim());
}

function eventDateFor(proposal: ProposalBookingConversionInput): Date | null {
  return toDate(proposal.lead?.eventDate ?? null);
}

function ageScore(daysSinceAccepted: number): number {
  if (daysSinceAccepted >= 7) return 28;
  if (daysSinceAccepted >= 3) return 18;
  return Math.max(4, daysSinceAccepted * 5);
}

function eventScore(daysUntilEvent: number | null): number {
  if (daysUntilEvent === null) return 0;
  if (daysUntilEvent <= 7) return 38;
  if (daysUntilEvent <= 14) return 24;
  if (daysUntilEvent <= 30) return 12;
  return 0;
}

function valueScore(total: number): number {
  if (total >= 1000) return 10;
  if (total >= 500) return 6;
  return 0;
}

function bandForScore(score: number): ProposalBookingConversionSuggestionBand {
  if (score >= 110) return 'ALTA';
  if (score >= 85) return 'MITJANA';
  return 'BAIXA';
}

function nameForProposal(proposal: ProposalBookingConversionInput): string {
  return proposal.customer?.name
    || proposal.lead?.name
    || proposal.reference;
}

function reasonsForProposal(
  proposal: ProposalBookingConversionInput,
  daysSinceAccepted: number,
  daysUntilEvent: number | null,
): string[] {
  const reasons = ['Pressupost acceptat', 'Reserva pendent de crear'];
  if (daysUntilEvent !== null && daysUntilEvent <= 30) reasons.push('Data propera');
  if (daysSinceAccepted > 0) reasons.push(`${daysSinceAccepted} ${daysSinceAccepted === 1 ? 'dia' : 'dies'} acceptat`);
  if (proposal.leadId) reasons.push('Lead vinculat');
  return reasons.slice(0, 4);
}

export function rankProposalBookingConversionSuggestions(
  proposals: ProposalBookingConversionInput[],
  limit = 3,
  now: Date = new Date(),
): ProposalBookingConversionSuggestion[] {
  return proposals
    .map((proposal) => {
      if (proposal.status !== 'ACCEPTED') return null;
      if (!proposal.customerId) return null;
      if (proposal.bookingId) return null;
      if (!hasCanonicalSentArtifact(proposal)) return null;

      const eventDate = eventDateFor(proposal);
      const eventDays = daysUntil(eventDate, now);
      if (eventDays !== null && eventDays < 0) return null;

      const acceptedAt = toDate(proposal.acceptedAt) ?? toDate(proposal.updatedAt) ?? toDate(proposal.createdAt);
      const acceptedDays = daysSince(acceptedAt, now);
      const score = 72 + ageScore(acceptedDays) + eventScore(eventDays) + valueScore(proposal.total);

      return {
        proposalId: proposal.id,
        reference: proposal.reference,
        customerId: proposal.customerId,
        leadId: proposal.leadId ?? null,
        name: nameForProposal(proposal),
        total: proposal.total,
        score,
        band: bandForScore(score),
        href: buildProposalBookingCreateHref({
          proposalId: proposal.id,
          leadId: proposal.leadId ?? null,
          customerId: proposal.customerId,
        }),
        reasons: reasonsForProposal(proposal, acceptedDays, eventDays),
        daysSinceAccepted: acceptedDays,
        daysUntilEvent: eventDays,
      };
    })
    .filter((item): item is ProposalBookingConversionSuggestion => Boolean(item))
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

export async function loadProposalBookingConversionSuggestions(
  limit = 3,
  now: Date = new Date(),
): Promise<ProposalBookingConversionSuggestion[]> {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: ProposalStatus.ACCEPTED,
      customerId: { not: null },
      bookingId: null,
      sentAt: { not: null },
      pdfUrl: { not: null },
      pdfKey: { not: null },
    },
    select: {
      id: true,
      reference: true,
      customerId: true,
      leadId: true,
      bookingId: true,
      status: true,
      total: true,
      acceptedAt: true,
      createdAt: true,
      updatedAt: true,
      sentAt: true,
      pdfUrl: true,
      pdfKey: true,
      customer: { select: { name: true, email: true } },
      lead: { select: { name: true, eventDate: true } },
    },
    orderBy: [{ acceptedAt: 'desc' }, { updatedAt: 'desc' }],
    take: 200,
  });

  return rankProposalBookingConversionSuggestions(proposals, limit, now);
}
