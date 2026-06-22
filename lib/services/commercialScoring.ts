import { LEAD_SCORING_STATUS_BASE, LEAD_SCORING_STATUS_PROBABILITY, EVENT_TYPE_DEFAULT_BUDGET, parseBudgetAmount } from '@/lib/constants';

type ScoreInput = {
  status: string;
  createdAt: Date;
  updatedAt: Date;
  eventDate?: Date | null;
  budget?: string | null;
  phone?: string | null;
  eventLocation?: string | null;
  guestCount?: number | null;
  interestedPackId?: string | null;
  source?: string | null;
  now?: Date;
};

type LeadScoreResult = {
  score: number;
  probability: number;
  band: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  riskFlags: string[];
};

// Wrapper de la font canònica `parseBudgetAmount` (lib/constants); retorna 0
// per al scoring (que suma el valor).
function parseBudgetValue(input?: string | null): number {
  return parseBudgetAmount(input) ?? 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const STATUS_BASE = LEAD_SCORING_STATUS_BASE;
const STATUS_PROBABILITY = LEAD_SCORING_STATUS_PROBABILITY;

export function scoreLead(input: ScoreInput): LeadScoreResult {
  const nowMs = (input.now ?? new Date()).getTime();
  const reasons: string[] = [];
  const riskFlags: string[] = [];
  let score = STATUS_BASE[input.status] ?? 25;

  const budget = parseBudgetValue(input.budget);
  if (budget >= 2000) {
    score += 14;
    reasons.push('Pressupost alt');
  } else if (budget >= 800) {
    score += 8;
    reasons.push('Pressupost mitjà');
  } else if (budget > 0) {
    score += 3;
  } else {
    riskFlags.push('Sense pressupost');
  }

  if (input.phone) {
    score += 8;
    reasons.push('Té telèfon');
  } else {
    riskFlags.push('Sense telèfon');
  }

  if (input.eventDate) {
    const daysToEvent = Math.ceil(
      (new Date(input.eventDate).getTime() - nowMs) / (1000 * 60 * 60 * 24)
    );
    if (daysToEvent >= 7 && daysToEvent <= 120) {
      score += 10;
      reasons.push('Data viable');
    } else if (daysToEvent < 0) {
      score -= 20;
      riskFlags.push('Esdeveniment passat');
    } else if (daysToEvent <= 3) {
      score -= 6;
      riskFlags.push('Esdeveniment molt imminent');
    }
  } else {
    riskFlags.push('Sense data d\'esdeveniment');
  }

  if (input.eventLocation) score += 4;
  if (input.guestCount && input.guestCount >= 40) score += 3;
  if (input.interestedPackId) score += 4;

  const staleHours = (nowMs - new Date(input.updatedAt).getTime()) / (1000 * 60 * 60);
  if (staleHours > 72 && !['WON', 'LOST'].includes(input.status)) {
    score -= 12;
    riskFlags.push('Sense seguiment 72h+');
  } else if (staleHours > 24 && ['NEW', 'CONTACTED'].includes(input.status)) {
    score -= 6;
    riskFlags.push('Seguiment lent');
  }

  if (input.source === 'REFERRAL') {
    score += 6;
    reasons.push('Lead referit');
  }
  if (input.source === 'WHATSAPP') score += 2;

  score = clamp(Math.round(score), 0, 100);
  const baseProb = STATUS_PROBABILITY[input.status] ?? 0.15;
  const probability = clamp(baseProb + (score - 50) * 0.004, 0.02, 0.98);

  return {
    score,
    probability,
    band: score >= 70 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW',
    reasons,
    riskFlags,
  };
}

export function estimateLeadAmount(input: {
  budget?: string | null;
  eventType?: string | null;
}): number {
  const parsed = parseBudgetValue(input.budget);
  if (parsed > 0) return parsed;

  return EVENT_TYPE_DEFAULT_BUDGET[input.eventType || 'OTHER'] ?? 1000;
}

