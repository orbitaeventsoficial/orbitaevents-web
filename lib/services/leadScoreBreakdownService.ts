// lib/services/leadScoreBreakdownService.ts
// ═══════════════════════════════════════════════════════════════════════════
// LEAD SCORE BREAKDOWN SERVICE
// Decomposa el score d'un lead en factors individuals amb impacte numèric.
// Funció pura — res de Prisma. Consum directe al UI per fer scoring explicable.
// ═══════════════════════════════════════════════════════════════════════════

import { LEAD_SCORING_STATUS_BASE, LEAD_SCORING_STATUS_PROBABILITY } from '@/lib/constants';

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type ScoreFactorType = 'BASE' | 'POSITIVE' | 'NEGATIVE';

export type ScoreFactor = {
  label: string;
  type: ScoreFactorType;
  points: number;
  icon: string;
};

export type ScoreBreakdown = {
  score: number;
  band: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number;
  factors: ScoreFactor[];
  positiveTotal: number;
  negativeTotal: number;
};

export type ScoreBreakdownInput = {
  status: string;
  createdAt: string;
  updatedAt: string;
  eventDate?: string | null;
  budget?: string | null;
  phone?: string | null;
  eventLocation?: string | null;
  guestCount?: number | null;
  interestedPackId?: string | null;
  source?: string | null;
  now?: Date;
};

// ───────────────────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────────────────

function parseBudgetValue(input?: string | null): number {
  if (!input) return 0;
  const normalized = input.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nova',
  CONTACTED: 'Contactada',
  QUOTE_SENT: 'Pressupost enviat',
  NEGOTIATING: 'Negociant',
  WON: 'Guanyada',
  LOST: 'Perduda',
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function generateScoreBreakdown(input: ScoreBreakdownInput): ScoreBreakdown {
  const now = input.now ?? new Date();
  const factors: ScoreFactor[] = [];
  let rawScore = 0;

  // 1. Status base
  const statusBase = LEAD_SCORING_STATUS_BASE[input.status] ?? 25;
  rawScore += statusBase;
  factors.push({
    label: `Estat: ${STATUS_LABELS[input.status] ?? input.status}`,
    type: 'BASE',
    points: statusBase,
    icon: '📊',
  });

  // 2. Budget
  const budget = parseBudgetValue(input.budget);
  if (budget >= 2000) {
    rawScore += 14;
    factors.push({ label: `Pressupost alt (${budget}€)`, type: 'POSITIVE', points: 14, icon: '💰' });
  } else if (budget >= 800) {
    rawScore += 8;
    factors.push({ label: `Pressupost mitjà (${budget}€)`, type: 'POSITIVE', points: 8, icon: '💰' });
  } else if (budget > 0) {
    rawScore += 3;
    factors.push({ label: `Pressupost baix (${budget}€)`, type: 'POSITIVE', points: 3, icon: '💰' });
  } else {
    factors.push({ label: 'Sense pressupost', type: 'NEGATIVE', points: 0, icon: '💰' });
  }

  // 3. Phone
  if (input.phone) {
    rawScore += 8;
    factors.push({ label: 'Té telèfon de contacte', type: 'POSITIVE', points: 8, icon: '📞' });
  } else {
    factors.push({ label: 'Sense telèfon', type: 'NEGATIVE', points: 0, icon: '📞' });
  }

  // 4. Event date
  if (input.eventDate) {
    const daysToEvent = Math.ceil(
      (new Date(input.eventDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysToEvent >= 7 && daysToEvent <= 120) {
      rawScore += 10;
      factors.push({ label: `Data viable (${daysToEvent}d)`, type: 'POSITIVE', points: 10, icon: '📅' });
    } else if (daysToEvent < 0) {
      rawScore -= 20;
      factors.push({ label: 'Esdeveniment passat', type: 'NEGATIVE', points: -20, icon: '📅' });
    } else if (daysToEvent <= 3) {
      rawScore -= 6;
      factors.push({ label: `Esdeveniment molt imminent (${daysToEvent}d)`, type: 'NEGATIVE', points: -6, icon: '📅' });
    }
  } else {
    factors.push({ label: 'Sense data d\'esdeveniment', type: 'NEGATIVE', points: 0, icon: '📅' });
  }

  // 5. Event location
  if (input.eventLocation) {
    rawScore += 4;
    factors.push({ label: 'Lloc definit', type: 'POSITIVE', points: 4, icon: '📍' });
  }

  // 6. Guest count
  if (input.guestCount && input.guestCount >= 40) {
    rawScore += 3;
    factors.push({ label: `${input.guestCount} convidats`, type: 'POSITIVE', points: 3, icon: '👥' });
  }

  // 7. Interested pack
  if (input.interestedPackId) {
    rawScore += 4;
    factors.push({ label: 'Pack seleccionat', type: 'POSITIVE', points: 4, icon: '📦' });
  }

  // 8. Staleness
  const staleHours = (now.getTime() - new Date(input.updatedAt).getTime()) / (1000 * 60 * 60);
  if (staleHours > 72 && !['WON', 'LOST'].includes(input.status)) {
    rawScore -= 12;
    factors.push({ label: `Sense seguiment ${Math.round(staleHours / 24)}d`, type: 'NEGATIVE', points: -12, icon: '⏳' });
  } else if (staleHours > 24 && ['NEW', 'CONTACTED'].includes(input.status)) {
    rawScore -= 6;
    factors.push({ label: 'Seguiment lent', type: 'NEGATIVE', points: -6, icon: '⏳' });
  }

  // 9. Source
  if (input.source === 'REFERRAL') {
    rawScore += 6;
    factors.push({ label: 'Lead referit', type: 'POSITIVE', points: 6, icon: '🤝' });
  } else if (input.source === 'WHATSAPP') {
    rawScore += 2;
    factors.push({ label: 'Via WhatsApp', type: 'POSITIVE', points: 2, icon: '💬' });
  }

  const score = clamp(Math.round(rawScore), 0, 100);
  const baseProb = LEAD_SCORING_STATUS_PROBABILITY[input.status] ?? 0.15;
  const probability = clamp(baseProb + (score - 50) * 0.004, 0.02, 0.98);

  let positiveTotal = 0;
  let negativeTotal = 0;
  for (const f of factors) {
    if (f.type === 'POSITIVE') positiveTotal += f.points;
    if (f.type === 'NEGATIVE') negativeTotal += f.points;
  }

  return {
    score,
    band: score >= 70 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW',
    probability,
    factors,
    positiveTotal,
    negativeTotal,
  };
}
