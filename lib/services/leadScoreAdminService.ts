import { prisma } from '@/lib/prisma';
import { estimateLeadAmount, scoreLead } from '@/lib/services/commercialScoring';
import { recordLeadScoreSnapshot } from '@/lib/services/leadActivityService';

function buildLeadScoring(lead: {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  eventDate: Date | null;
  budget: string | null;
  phone: string | null;
  eventLocation: string | null;
  guestCount: number | null;
  interestedPackId: string | null;
  source: string | null;
  eventType: string | null;
}, now: Date) {
  const scoring = scoreLead({
    status: lead.status,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    eventDate: lead.eventDate,
    budget: lead.budget,
    phone: lead.phone,
    eventLocation: lead.eventLocation,
    guestCount: lead.guestCount,
    interestedPackId: lead.interestedPackId,
    source: lead.source,
    now,
  });

  const amount = estimateLeadAmount({ budget: lead.budget, eventType: lead.eventType });
  const weightedAmount = amount * scoring.probability;

  return { scoring, weightedAmount };
}

export async function getAdminLeadScore(id: string, now: Date = new Date()) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return { status: 404, body: { ok: false, error: 'Lead no trobat' } };
  }

  const { scoring, weightedAmount } = buildLeadScoring(lead, now);

  return {
    status: 200,
    body: {
      ok: true,
      score: scoring.score,
      band: scoring.band,
      probability: scoring.probability,
      weightedAmount,
      reasons: scoring.reasons,
      riskFlags: scoring.riskFlags,
    },
  };
}

export async function createAdminLeadScoreSnapshot(id: string, now: Date = new Date()) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return { status: 404, body: { ok: false, error: 'Lead no trobat' } };
  }

  const { scoring, weightedAmount } = buildLeadScoring(lead, now);

  await recordLeadScoreSnapshot({
    leadId: lead.id,
    score: scoring.score,
    band: scoring.band,
    probability: scoring.probability,
    weightedAmount,
    reasons: scoring.reasons,
    riskFlags: scoring.riskFlags,
  });

  return {
    status: 200,
    body: {
      ok: true,
      score: scoring.score,
      band: scoring.band,
      probability: scoring.probability,
      weightedAmount,
    },
  };
}
