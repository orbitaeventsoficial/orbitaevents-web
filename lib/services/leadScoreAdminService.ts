import { prisma } from '@/lib/prisma';
import { estimateLeadAmount, scoreLead } from '@/lib/services/commercialScoring';

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
}) {
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
  });

  const amount = estimateLeadAmount({ budget: lead.budget, eventType: lead.eventType });
  const weightedAmount = amount * scoring.probability;

  return { scoring, weightedAmount };
}

export async function getAdminLeadScore(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return { status: 404, body: { ok: false, error: 'Lead no trobat' } };
  }

  const { scoring, weightedAmount } = buildLeadScoring(lead);

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

export async function createAdminLeadScoreSnapshot(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return { status: 404, body: { ok: false, error: 'Lead no trobat' } };
  }

  const { scoring, weightedAmount } = buildLeadScoring(lead);

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      type: 'SYSTEM',
      title: 'Scoring snapshot',
      description: `Score ${scoring.score} (${scoring.band}) · Prob ${(scoring.probability * 100).toFixed(1)}% · Weighted ${weightedAmount.toFixed(2)}€`,
      createdBy: 'Scoring Bot',
      metadata: {
        score: scoring.score,
        band: scoring.band,
        probability: scoring.probability,
        weightedAmount,
        reasons: scoring.reasons,
        riskFlags: scoring.riskFlags,
      },
    },
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
