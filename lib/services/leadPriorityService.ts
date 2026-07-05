// lib/services/leadPriorityService.ts
// ═══════════════════════════════════════════════════════════════════════════
// LEAD PRIORITY SERVICE (Onada 1 — autopilot comercial)
// «Quins leads treballar AVUI»: rànquing dels leads oberts per score comercial
// (font única: `scoreLead` de commercialScoring). NO reimplementa cap regla de
// scoring; només carrega els leads oberts, els puntua amb el cervell existent i
// n'ordena els N primers amb la raó principal i el risc principal per a la UI.
// Part pura (`rankLeadsToWork`) + wrapper Prisma (`loadTopLeadsToWork`).
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { OPEN_LEAD_STATUSES } from '@/lib/constants';
import { scoreLead } from './commercialScoring';

export type LeadToWork = {
  id: string;
  name: string;
  status: string;
  score: number;
  band: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number;
  topReason: string | null;
  topRisk: string | null;
  eventDate: Date | null;
  budget: string | null;
};

/** Lead mínim per puntuar (mateixos camps que consumeix `scoreLead`). */
export type RankableLead = {
  id: string;
  name: string;
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
};

/**
 * Pura i determinista: puntua cada lead amb el cervell canònic `scoreLead` i
 * torna els `limit` primers per score descendent, amb la raó i el risc principals.
 */
export function rankLeadsToWork(leads: RankableLead[], limit = 5, now: Date = new Date()): LeadToWork[] {
  return leads
    .map((l) => {
      const s = scoreLead({
        status: l.status,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        eventDate: l.eventDate,
        budget: l.budget,
        phone: l.phone,
        eventLocation: l.eventLocation,
        guestCount: l.guestCount,
        interestedPackId: l.interestedPackId,
        source: l.source,
        now,
      });
      return {
        id: l.id,
        name: l.name,
        status: l.status,
        score: s.score,
        band: s.band,
        probability: s.probability,
        topReason: s.reasons[0] ?? null,
        topRisk: s.riskFlags[0] ?? null,
        eventDate: l.eventDate,
        budget: l.budget,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, limit));
}

/** Wrapper amb I/O: carrega els leads oberts i en torna els `limit` prioritaris. */
export async function loadTopLeadsToWork(limit = 5, now: Date = new Date()): Promise<LeadToWork[]> {
  const leads = await prisma.lead.findMany({
    where: { status: { in: [...OPEN_LEAD_STATUSES] } },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      eventDate: true,
      budget: true,
      phone: true,
      eventLocation: true,
      guestCount: true,
      interestedPackId: true,
      source: true,
    },
    take: 500,
  });
  return rankLeadsToWork(leads, limit, now);
}
