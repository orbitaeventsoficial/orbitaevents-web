// Recomanacions internes de contractes pendents. No genera PDFs, no envia
// correus i no muta dades: només prioritza propostes acceptades que encara
// tenen contracte pendent de generar, enviar o signar.

import { ContractStatus, ProposalStatus } from '@prisma/client';
import { buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';
import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

export type ContractWorkflowAction = 'GENERATE_CONTRACT' | 'SEND_CONTRACT' | 'FOLLOW_SIGNATURE';
export type ContractWorkflowSuggestionBand = 'ALTA' | 'MITJANA' | 'BAIXA';

export type ContractWorkflowProposalInput = {
  id: string;
  reference: string;
  customerId: string | null;
  bookingId?: string | null;
  status: string;
  total: number;
  acceptedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  contractReference: string | null;
  contractStatus: string | null;
  contractSentAt: Date | string | null;
  contractSignedAt: Date | string | null;
  customer?: { name: string | null; email?: string | null } | null;
  booking?: { eventDate: Date | string | null; clientName?: string | null; reference?: string | null } | null;
};

export type ContractWorkflowSuggestion = {
  proposalId: string;
  reference: string;
  customerId: string;
  name: string;
  total: number;
  action: ContractWorkflowAction;
  score: number;
  band: ContractWorkflowSuggestionBand;
  href: string;
  reasons: string[];
  contractStatus: string | null;
  contractReference: string | null;
  daysSinceAccepted: number | null;
  daysSinceSent: number | null;
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

function daysSince(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY_MS));
}

function daysUntil(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.ceil((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

function resolveAction(proposal: ContractWorkflowProposalInput): ContractWorkflowAction | null {
  if (proposal.status !== 'ACCEPTED') return null;
  if (!proposal.customerId) return null;
  if (!proposal.bookingId) return null;
  if (proposal.contractSignedAt) return null;
  if (proposal.contractStatus === 'SIGNED' || proposal.contractStatus === 'CANCELLED') return null;

  if (!proposal.contractStatus || !proposal.contractReference) return 'GENERATE_CONTRACT';
  if (proposal.contractStatus === 'DRAFT') return 'SEND_CONTRACT';
  if (proposal.contractStatus === 'SENT') return 'FOLLOW_SIGNATURE';
  return null;
}

function baseScore(action: ContractWorkflowAction): number {
  switch (action) {
    case 'GENERATE_CONTRACT': return 82;
    case 'SEND_CONTRACT': return 96;
    case 'FOLLOW_SIGNATURE': return 62;
  }
}

function eventScore(daysUntilEvent: number | null): number {
  if (daysUntilEvent === null) return 0;
  if (daysUntilEvent <= 7) return 35;
  if (daysUntilEvent <= 14) return 22;
  if (daysUntilEvent <= 30) return 10;
  return 0;
}

function agingScore(action: ContractWorkflowAction, daysSinceAccepted: number | null, daysSinceSent: number | null): number {
  if (action === 'FOLLOW_SIGNATURE') {
    if (daysSinceSent === null) return 0;
    if (daysSinceSent >= 7) return 28;
    if (daysSinceSent >= 3) return 18;
    return Math.max(0, daysSinceSent * 4);
  }
  if (daysSinceAccepted === null) return 0;
  return Math.min(24, daysSinceAccepted * 4);
}

function bandForScore(score: number): ContractWorkflowSuggestionBand {
  if (score >= 100) return 'ALTA';
  if (score >= 70) return 'MITJANA';
  return 'BAIXA';
}

function reasonsForProposal(
  proposal: ContractWorkflowProposalInput,
  action: ContractWorkflowAction,
  daysSinceAccepted: number | null,
  daysSinceSent: number | null,
  daysUntilEvent: number | null,
): string[] {
  const reasons: string[] = ['Pressupost acceptat'];
  if (action === 'GENERATE_CONTRACT') {
    reasons.push(proposal.contractStatus === 'DRAFT' && !proposal.contractReference
      ? 'DRAFT sense referència'
      : 'Contracte pendent de generar');
  }
  if (action === 'SEND_CONTRACT') reasons.push('Contracte generat', 'Pendent d\'enviar');
  if (action === 'FOLLOW_SIGNATURE') reasons.push('Contracte enviat', 'Signatura pendent');
  if (daysSinceAccepted !== null && action !== 'FOLLOW_SIGNATURE') reasons.push(`${daysSinceAccepted} dies acceptat`);
  if (daysSinceSent !== null && action === 'FOLLOW_SIGNATURE') reasons.push(`${daysSinceSent} dies sense signatura`);
  if (daysUntilEvent !== null && daysUntilEvent <= 30) reasons.push('Bolo proper');
  return reasons.slice(0, 4);
}

export function rankContractWorkflowSuggestions(
  proposals: ContractWorkflowProposalInput[],
  limit = 3,
  now: Date = new Date(),
): ContractWorkflowSuggestion[] {
  return proposals
    .map((proposal) => {
      const action = resolveAction(proposal);
      if (!action || !proposal.customerId) return null;

      const acceptedAt = toDate(proposal.acceptedAt) ?? toDate(proposal.updatedAt) ?? toDate(proposal.createdAt);
      const sentAt = toDate(proposal.contractSentAt);
      const eventDate = toDate(proposal.booking?.eventDate ?? null);
      const acceptedDays = daysSince(acceptedAt, now);
      const sentDays = daysSince(sentAt, now);
      const eventDays = daysUntil(eventDate, now);
      if (eventDays !== null && eventDays < 0) return null;

      const score = baseScore(action) + eventScore(eventDays) + agingScore(action, acceptedDays, sentDays);

      return {
        proposalId: proposal.id,
        reference: proposal.reference,
        customerId: proposal.customerId,
        name: proposal.customer?.name || proposal.booking?.clientName || proposal.reference,
        total: proposal.total,
        action,
        score,
        band: bandForScore(score),
        href: buildCustomerWorkspaceTabHref(proposal.customerId, 'proposals'),
        reasons: reasonsForProposal(proposal, action, acceptedDays, sentDays, eventDays),
        contractStatus: proposal.contractStatus,
        contractReference: proposal.contractReference,
        daysSinceAccepted: acceptedDays,
        daysSinceSent: sentDays,
        daysUntilEvent: eventDays,
      };
    })
    .filter((item): item is ContractWorkflowSuggestion => Boolean(item))
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

export async function loadContractWorkflowSuggestions(limit = 3, now: Date = new Date()): Promise<ContractWorkflowSuggestion[]> {
  const proposals = await prisma.proposal.findMany({
    where: {
      status: ProposalStatus.ACCEPTED,
      customerId: { not: null },
      contractSignedAt: null,
      OR: [
        { contractStatus: null },
        { contractStatus: { in: [ContractStatus.DRAFT, ContractStatus.SENT] } },
      ],
    },
    select: {
      id: true,
      reference: true,
      customerId: true,
      bookingId: true,
      status: true,
      total: true,
      acceptedAt: true,
      createdAt: true,
      updatedAt: true,
      contractReference: true,
      contractStatus: true,
      contractSentAt: true,
      contractSignedAt: true,
      customer: { select: { name: true, email: true } },
      booking: { select: { eventDate: true, clientName: true, reference: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 200,
  });

  return rankContractWorkflowSuggestions(proposals, limit, now);
}
