import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { estimateLeadAmount, scoreLead } from '@/lib/services/commercialScoring';

interface Params {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ ok: false, error: 'Lead no trobat' }, { status: 404 });

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

  return NextResponse.json({
    ok: true,
    score: scoring.score,
    band: scoring.band,
    probability: scoring.probability,
    weightedAmount: amount * scoring.probability,
    reasons: scoring.reasons,
    riskFlags: scoring.riskFlags,
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'automation');
  if (permissionError) return permissionError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ ok: false, error: 'Lead no trobat' }, { status: 404 });

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

  return NextResponse.json({
    ok: true,
    score: scoring.score,
    band: scoring.band,
    probability: scoring.probability,
    weightedAmount,
  });
}

