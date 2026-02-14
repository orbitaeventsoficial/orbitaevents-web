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
};

export type LeadScoreResult = {
  score: number;
  probability: number;
  band: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  riskFlags: string[];
};

function parseBudgetValue(input?: string | null): number {
  if (!input) return 0;
  const normalized = input.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const STATUS_BASE: Record<string, number> = {
  NEW: 20,
  CONTACTED: 40,
  QUOTE_SENT: 60,
  NEGOTIATING: 72,
  WON: 95,
  LOST: 5,
};

const STATUS_PROBABILITY: Record<string, number> = {
  NEW: 0.12,
  CONTACTED: 0.22,
  QUOTE_SENT: 0.38,
  NEGOTIATING: 0.57,
  WON: 0.95,
  LOST: 0.03,
};

export function scoreLead(input: ScoreInput): LeadScoreResult {
  const reasons: string[] = [];
  const riskFlags: string[] = [];
  let score = STATUS_BASE[input.status] ?? 25;

  const budget = parseBudgetValue(input.budget);
  if (budget >= 2000) {
    score += 14;
    reasons.push('Budget alto');
  } else if (budget >= 800) {
    score += 8;
    reasons.push('Budget medio');
  } else if (budget > 0) {
    score += 3;
  } else {
    riskFlags.push('Sin presupuesto');
  }

  if (input.phone) {
    score += 8;
    reasons.push('Tiene teléfono');
  } else {
    riskFlags.push('Sin teléfono');
  }

  if (input.eventDate) {
    const daysToEvent = Math.ceil(
      (new Date(input.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysToEvent >= 7 && daysToEvent <= 120) {
      score += 10;
      reasons.push('Fecha viable');
    } else if (daysToEvent < 0) {
      score -= 20;
      riskFlags.push('Evento en pasado');
    } else if (daysToEvent <= 3) {
      score -= 6;
      riskFlags.push('Evento muy inminente');
    }
  } else {
    riskFlags.push('Sin fecha de evento');
  }

  if (input.eventLocation) score += 4;
  if (input.guestCount && input.guestCount >= 40) score += 3;
  if (input.interestedPackId) score += 4;

  const staleHours = (Date.now() - new Date(input.updatedAt).getTime()) / (1000 * 60 * 60);
  if (staleHours > 72 && !['WON', 'LOST'].includes(input.status)) {
    score -= 12;
    riskFlags.push('Sin seguimiento 72h+');
  } else if (staleHours > 24 && ['NEW', 'CONTACTED'].includes(input.status)) {
    score -= 6;
    riskFlags.push('Seguimiento lento');
  }

  if (input.source === 'REFERRAL') {
    score += 6;
    reasons.push('Lead referido');
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

  const fallbackByType: Record<string, number> = {
    WEDDING: 1800,
    CORPORATE: 1500,
    BIRTHDAY: 850,
    PRIVATE_PARTY: 900,
    COMMUNION: 700,
    BAPTISM: 650,
    GRADUATION: 800,
    ANNIVERSARY: 900,
    OTHER: 1000,
  };
  return fallbackByType[input.eventType || 'OTHER'] ?? 1000;
}

