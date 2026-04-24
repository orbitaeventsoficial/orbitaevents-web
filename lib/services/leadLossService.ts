import { prisma } from '@/lib/prisma';
import {
  LEAD_LOST_REASON_LABELS,
  isLeadLostReason,
  type LeadLostReason,
} from '@/lib/constants/leadLoss';
import { recordLeadLost } from '@/lib/services/leadActivityService';

export type MarkLeadAsLostInput = {
  leadId: string;
  reason: string;
  note?: string | null;
  actor?: string | null;
  now?: Date;
};

export type MarkLeadAsLostResult =
  | { ok: true; lead: { id: string; status: 'LOST'; lostReason: LeadLostReason; lostAt: Date } }
  | { ok: false; status: number; error: string };

export function buildLostActivityDescription(
  reason: LeadLostReason,
  note: string | null | undefined,
): string {
  const label = LEAD_LOST_REASON_LABELS[reason];
  const trimmedNote = note?.trim();
  return trimmedNote ? `${label} — ${trimmedNote}` : label;
}

export async function markLeadAsLost(input: MarkLeadAsLostInput): Promise<MarkLeadAsLostResult> {
  if (!isLeadLostReason(input.reason)) {
    return { ok: false, status: 400, error: 'Motiu de pèrdua invàlid' };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: { id: true, status: true },
  });

  if (!lead) {
    return { ok: false, status: 404, error: 'Lead no trobat' };
  }

  const reason: LeadLostReason = input.reason;
  const lostAt = input.now ?? new Date();

  const updated = await prisma.lead.update({
    where: { id: input.leadId },
    data: {
      status: 'LOST',
      lostReason: reason,
      lostAt,
    },
    select: { id: true, status: true, lostReason: true, lostAt: true },
  });

  await recordLeadLost({
    leadId: input.leadId,
    fromStatus: lead.status,
    reason,
    description: buildLostActivityDescription(reason, input.note),
    note: input.note?.trim() || null,
    actor: input.actor ?? 'Admin',
  });

  return {
    ok: true,
    lead: {
      id: updated.id,
      status: 'LOST',
      lostReason: (updated.lostReason ?? reason) as LeadLostReason,
      lostAt: updated.lostAt ?? lostAt,
    },
  };
}
