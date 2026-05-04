import type { PackDefinition, ServiceSlug } from '@/app/config/packs-config';
import { getAllPacks } from '@/app/config/packs-config';

export type LeadEventType =
  | 'WEDDING'
  | 'BIRTHDAY'
  | 'CORPORATE'
  | 'COMMUNION'
  | 'BAPTISM'
  | 'GRADUATION'
  | 'ANNIVERSARY'
  | 'PRIVATE_PARTY'
  | 'OTHER';

export const EVENT_TYPE_TO_SERVICE: Record<LeadEventType, ServiceSlug> = {
  WEDDING: 'bodas',
  CORPORATE: 'empresas',
  BIRTHDAY: 'discomovil',
  COMMUNION: 'discomovil',
  BAPTISM: 'discomovil',
  GRADUATION: 'discomovil',
  ANNIVERSARY: 'discomovil',
  PRIVATE_PARTY: 'discomovil',
  OTHER: 'discomovil',
};

export interface PackSuggestionInput {
  eventType: LeadEventType | string | null;
  guestCount: number | null;
  budget: string | null;
}

export interface ParsedBudget {
  min: number;
  max: number;
}

export interface PackMatchScore {
  pack: PackDefinition;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
  warnings: string[];
}

export interface PackSuggestionResult {
  best: PackMatchScore | null;
  alternatives: PackMatchScore[];
  serviceSlug: ServiceSlug | null;
  unmatched: boolean;
}

export function parseBudgetRange(raw: string | null | undefined): ParsedBudget | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  if (!cleaned) return null;
  const normalized = cleaned
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (/^(\+|>|mesde)/.test(normalized)) {
    const m = normalized.match(/(\d+(?:\.\d+)?)/);
    if (m) {
      const value = Number(m[1]);
      if (Number.isFinite(value) && value >= 0) return { min: value, max: Number.POSITIVE_INFINITY };
    }
    return null;
  }

  if (/^(<|menysde|finsa)/.test(normalized)) {
    const m = normalized.match(/(\d+(?:\.\d+)?)/);
    if (m) {
      const value = Number(m[1]);
      if (Number.isFinite(value) && value >= 0) return { min: 0, max: value };
    }
    return null;
  }

  const rangeMatch = normalized.match(/^(\d+(?:\.\d+)?)[-–](\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max >= min) {
      return { min, max };
    }
    return null;
  }

  const singleMatch = normalized.match(/^(\d+(?:\.\d+)?)$/);
  if (singleMatch) {
    const value = Number(singleMatch[1]);
    if (Number.isFinite(value) && value >= 0) return { min: value, max: value };
  }

  return null;
}

const CAPACITY_PERFECT = 60;
const CAPACITY_UNDERFLOW = 20;
const CAPACITY_OVERFLOW = 5;
const CAPACITY_NO_DATA = 30;
const BUDGET_PERFECT = 25;
const BUDGET_TOLERANCE = 12;
const BUDGET_NO_DATA = 12;
const POPULAR_BONUS = 10;
const BASE_FALLBACK = 5;
const UNMATCHED_THRESHOLD = 40;

function scorePack(pack: PackDefinition, input: PackSuggestionInput): PackMatchScore {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = BASE_FALLBACK;

  const guests = input.guestCount;
  if (guests != null && Number.isFinite(guests) && guests > 0) {
    const min = pack.capacidadMinima ?? 0;
    const max = pack.capacidadMaxima ?? Number.POSITIVE_INFINITY;
    if (guests >= min && guests <= max) {
      score += CAPACITY_PERFECT;
      const maxLabel = max === Number.POSITIVE_INFINITY ? '∞' : String(max);
      reasons.push(`Capacitat ${guests} dins el rang ${min}-${maxLabel}`);
    } else if (guests < min) {
      score += CAPACITY_UNDERFLOW;
      warnings.push(`Pack pensat per ≥ ${min} convidats (lead: ${guests})`);
    } else {
      score += CAPACITY_OVERFLOW;
      warnings.push(`Capacitat lead ${guests} > màxima del pack ${max}`);
    }
  } else {
    score += CAPACITY_NO_DATA;
  }

  const budgetRange = parseBudgetRange(input.budget);
  if (budgetRange) {
    if (pack.priceValue >= budgetRange.min && pack.priceValue <= budgetRange.max) {
      score += BUDGET_PERFECT;
      const maxLabel = budgetRange.max === Number.POSITIVE_INFINITY ? '∞' : String(budgetRange.max);
      reasons.push(`Preu ${pack.priceValue}€ dins pressupost ${budgetRange.min}-${maxLabel}€`);
    } else {
      const tolerance = 0.2;
      const minTol = budgetRange.min * (1 - tolerance);
      const maxTol =
        budgetRange.max === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : budgetRange.max * (1 + tolerance);
      if (pack.priceValue >= minTol && pack.priceValue <= maxTol) {
        score += BUDGET_TOLERANCE;
        warnings.push(`Preu ${pack.priceValue}€ pròxim al pressupost demanat (±20%)`);
      } else if (pack.priceValue < budgetRange.min) {
        warnings.push(`Pack ${pack.priceValue}€ per sota del pressupost demanat`);
      } else {
        warnings.push(`Pack ${pack.priceValue}€ per sobre del pressupost demanat`);
      }
    }
  } else {
    score += BUDGET_NO_DATA;
  }

  if (pack.popular) {
    score += POPULAR_BONUS;
    reasons.push('Pack popular del catàleg');
  }

  score = Math.min(100, Math.max(0, Math.round(score)));
  const confidence: 'low' | 'medium' | 'high' = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';

  return { pack, score, confidence, reasons, warnings };
}

export function suggestPackForLead(
  input: PackSuggestionInput,
  packs?: PackDefinition[],
): PackSuggestionResult {
  const allPacks = packs ?? getAllPacks();
  const eventTypeRaw = input.eventType;
  const serviceSlug =
    typeof eventTypeRaw === 'string' && (eventTypeRaw as LeadEventType) in EVENT_TYPE_TO_SERVICE
      ? EVENT_TYPE_TO_SERVICE[eventTypeRaw as LeadEventType]
      : null;

  if (!serviceSlug) {
    return { best: null, alternatives: [], serviceSlug: null, unmatched: true };
  }

  const candidates = allPacks.filter((p) => p.service === serviceSlug);
  if (candidates.length === 0) {
    return { best: null, alternatives: [], serviceSlug, unmatched: true };
  }

  const scored = candidates.map((p) => scorePack(p, input)).sort((a, b) => b.score - a.score);
  const [best, ...rest] = scored;

  return {
    best: best ?? null,
    alternatives: rest.slice(0, 2),
    serviceSlug,
    unmatched: !best || best.score < UNMATCHED_THRESHOLD,
  };
}
