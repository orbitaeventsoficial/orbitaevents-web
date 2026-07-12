/**
 * Tipus, constants i funcions pures del PDF Studio.
 * Extret de PresupuestoPdfStudio.tsx per reduir la mida del component.
 */

import {
  ALL_SERVICES,
  type ExtraDefinition,
  type PackDefinition,
  type ServiceSlug,
} from '@/app/config/packs-config';
import { z } from 'zod';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_PDF_STUDIO_COPY, ADMIN_PDF_STUDIO_CUSTOM_PACK_ID, ADMIN_PDF_STUDIO_DEFAULT_COLLAPSED_SECTIONS, ADMIN_PDF_STUDIO_DEFAULT_SECTION_ORDER, ADMIN_PDF_STUDIO_DRAFT_KEY, ADMIN_PDF_STUDIO_OPERATOR_EXTRA_ID, ADMIN_PDF_STUDIO_SECTION_LABELS, ADMIN_PDF_STUDIO_SERVICE_LABELS } from '@/lib/constants/admin';
import { formatCurrencyExact } from '@/lib/constants';
import { log } from '@/lib/logger';
import { TRAVEL_COST_LINE_MARKER, type TravelHeadcountLineLike } from '@/lib/services/travelLaborCost';

// --- Types --------------------------------------------------------------

export type DocMode = 'quote' | 'contract';

export type SectionId = 'config' | 'client' | 'brand' | 'transport' | 'pack' | 'extras-catalog' | 'extras-custom' | 'contract';

import type { Locale } from '@/i18n';
export type { Locale };

export type CustomExtra = {
  id: string;
  name: string;
  price: number;
};

export type PricingCatalogState = {
  packNamesBySlug: Record<string, string>;
  extraNamesBySlug: Record<string, string>;
  extraDescriptionsBySlug: Record<string, string>;
};

export type PricingCatalogPack = {
  slug?: string;
  name?: string;
};

export type PricingCatalogExtra = {
  slug?: string;
  name?: string;
  description?: string | null;
};

export type PricingCatalogCustomer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
};

export type PricingCatalogResponse = {
  ok?: boolean;
  error?: string;
  oneWayKm?: number;
  roundTripKm?: number;
  data?: {
    packs?: PricingCatalogPack[];
    extras?: PricingCatalogExtra[];
    customers?: PricingCatalogCustomer[];
  };
};

export type ProfitabilityConfigResponse = {
  ok?: boolean;
  config?: {
    packCostRatio: number;
    extraCostRatio: number;
    extraHourCostRatio: number;
    fixedOperationalCost: number;
    channelCac: Record<string, number>;
  } | null;
  defaults?: {
    packCostRatio: number;
    extraCostRatio: number;
    extraHourCostRatio: number;
    fixedOperationalCost: number;
    channelCac: Record<string, number>;
  } | null;
};

export type StudioProps = {
  initialCustomerId?: string;
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  initialCustomerPhone?: string;
  initialEventType?: ServiceSlug;
  initialEventDate?: string;
  initialEventSchedule?: string;
  initialEventLocation?: string;
  initialDistanceKm?: number;
  initialTollsEur?: number;
  initialVehicleCostPerKm?: number;
  initialGuests?: number;
  initialLeadId?: string;
  initialLeadServiceLines?: StudioLeadServiceLine[];
  initialProposalId?: string;
  initialProposalStatus?: string;
  initialPreferLeadPrefill?: boolean;
  initialPreferredLocale?: string;
  initialBrandName?: string;
  initialBrandWebsite?: string;
  initialBrandEmail?: string;
  initialBrandPhone?: string;
  initialBrandTagline?: string;
  initialBrandLogoDataUrl?: string;
};

export type StudioLeadServiceLine = TravelHeadcountLineLike & {
  id?: string;
  partyType?: string | null;
  hours?: number | null;
};

// --- Constants ----------------------------------------------------------

export const SECTION_LABELS: Record<SectionId, string> = ADMIN_PDF_STUDIO_SECTION_LABELS;

export const DEFAULT_SECTION_ORDER: SectionId[] = [...ADMIN_PDF_STUDIO_DEFAULT_SECTION_ORDER];

export const DEFAULT_COLLAPSED_SECTIONS: SectionId[] = [...ADMIN_PDF_STUDIO_DEFAULT_COLLAPSED_SECTIONS];

export const STUDIO_DRAFT_KEY = ADMIN_PDF_STUDIO_DRAFT_KEY;
export const CUSTOM_PACK_ID = ADMIN_PDF_STUDIO_CUSTOM_PACK_ID;
export const OPERATOR_PDF_EXTRA_ID = ADMIN_PDF_STUDIO_OPERATOR_EXTRA_ID;

export const STUDIO_COPY: Record<Locale, { hours: string; customServiceName: string; customExtraDescription: string; defaultClientName: string; sendQuote: string; sendingQuote: string; noDate: string; noSchedule: string; noLocation: string; clientLabel: string }> = ADMIN_PDF_STUDIO_COPY;

export const SERVICE_LABEL: Record<ServiceSlug, string> = ADMIN_PDF_STUDIO_SERVICE_LABELS;

export { ALL_SERVICES };
export type { ExtraDefinition, PackDefinition, ServiceSlug };

// --- Validation ---------------------------------------------------------

export const quoteStudioSchema = z.object({
  clientName: z.string().trim().min(2, 'Nom del client massa curt'),
  clientEmail: z.string().trim().email("Correu del client no vàlid"),
  guests: z.number().int().min(1, 'Convidats ha de ser minim 1'),
  validityDays: z.number().int().min(1).max(120),
  basePrice: z.number().min(0),
});

// --- Pure functions -----------------------------------------------------

export function normalizeStudioLocale(value?: string): Locale {
  const raw = String(value || '').toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('en')) return 'en';
  return 'ca';
}

export function formatEUR(value: number): string {
  return formatCurrencyExact(Math.max(0, value));
}

function normalizeMatchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function inferStudioServiceFromLead(input: {
  eventType?: string | null;
  serviceLines?: StudioLeadServiceLine[];
}): ServiceSlug {
  const serviceText = normalizeMatchText(
    (input.serviceLines || [])
      .map((line) => [line.label, line.kind, line.partyType].filter(Boolean).join(' '))
      .join(' '),
  );
  const eventType = String(input.eventType || '').toUpperCase();
  const allText = `${normalizeMatchText(eventType)} ${serviceText}`;

  if (/\b(bingo|batalla|animacio|animacion)\b/.test(allText)) return 'animacion';
  if (/\b(wedding|wedding_party|boda|bodas|casament|casaments)\b/.test(allText)) return 'bodas';
  if (/\b(corporate|empresa|empresas|company|team\s*building)\b/.test(allText)) return 'empresas';
  if (/\b(discomovil|disco|dj)\b/.test(allText)) return 'discomovil';

  switch (eventType) {
    case 'WEDDING':
      return 'bodas';
    case 'CORPORATE':
      return 'empresas';
    case 'BIRTHDAY':
    case 'PRIVATE_PARTY':
    case 'COMMUNION':
    case 'BAPTISM':
    case 'GRADUATION':
    case 'ANNIVERSARY':
      return 'fiestas';
    default:
      return 'fiestas';
  }
}

function positiveQuantity(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

function isInternalTravelLine(line: { notes?: string | null }): boolean {
  return Boolean(line.notes?.includes(TRAVEL_COST_LINE_MARKER));
}

export function leadServiceLinesForTransport(lines: StudioLeadServiceLine[]): TravelHeadcountLineLike[] {
  return lines.filter((line) => !isInternalTravelLine(line));
}

export function buildCustomExtrasFromLeadServiceLines(lines: StudioLeadServiceLine[]): CustomExtra[] {
  return lines
    .filter((line) => !isInternalTravelLine(line))
    .map((line, index) => {
      const label = line.label?.trim() || '';
      const quantity = positiveQuantity(line.quantity);
      const revenue = typeof line.revenueAmount === 'number' && Number.isFinite(line.revenueAmount)
        ? line.revenueAmount
        : 0;
      return {
        id: line.id ? `lead-line-${line.id}` : `lead-line-${index + 1}`,
        name: quantity > 1 ? `${label} x${quantity}` : label,
        price: Math.max(0, revenue * quantity),
      };
    })
    .filter((line) => line.name && line.price > 0);
}

export function buildLeadServiceFeatureLines(lines: StudioLeadServiceLine[]): string[] {
  return lines
    .filter((line) => !isInternalTravelLine(line))
    .map((line) => line.label?.trim() || '')
    .filter(Boolean);
}

export function deriveLeadDurationHours(lines: StudioLeadServiceLine[], fallback = 1): number {
  const hours = lines.reduce((sum, line) => {
    const value = typeof line.hours === 'number' && Number.isFinite(line.hours) && line.hours > 0 && line.hours <= 24 ? line.hours : 0;
    return sum + value;
  }, 0);
  return Math.max(1, Math.round((hours || fallback) * 100) / 100);
}

export function deriveEventScheduleDurationHours(schedule?: string | null): number | null {
  const text = typeof schedule === 'string' ? schedule.trim() : '';
  if (!text) return null;

  const times = Array.from(text.matchAll(/\b([01]?\d|2[0-3])(?:[:.h])([0-5]\d)\b/g))
    .map((match) => Number(match[1]) * 60 + Number(match[2]));
  if (times.length < 2) return null;

  const start = times[0];
  const end = times[1];
  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;
  const hours = Math.round((diff / 60) * 100) / 100;
  return hours > 0 && hours <= 24 ? hours : null;
}

export function deriveStudioDurationHours(params: {
  eventSchedule?: string | null;
  lines?: StudioLeadServiceLine[];
  fallback?: number;
}): number {
  const scheduleHours = deriveEventScheduleDurationHours(params.eventSchedule);
  if (scheduleHours !== null) return scheduleHours;
  return deriveLeadDurationHours(params.lines || [], params.fallback ?? 1);
}

export function toFeatureLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildPackFromForm(params: {
  source: PackDefinition;
  name: string;
  price: number;
  durationHours: number;
  featuresText: string;
  locale: Locale;
}): PackDefinition {
  const features = toFeatureLines(params.featuresText);
  const duration = Math.max(1, Math.round(params.durationHours));
  return {
    ...params.source,
    name: params.name.trim() || params.source.name,
    priceValue: Math.max(0, params.price),
    price: formatEUR(params.price),
    durationHours: duration,
    duration: `${duration} ${STUDIO_COPY[params.locale].hours}`,
    features: features.length > 0 ? features : params.source.features,
  };
}

// --- Translation cache --------------------------------------------------

const pdfTranslationCache = new Map<string, Map<Locale, string>>();

export async function translateBatchForPdf(texts: string[], locale: Locale): Promise<Map<string, string>> {
  const cleaned = texts.map((t) => t.trim()).filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  const result = new Map<string, string>();

  if (unique.length === 0) return result;

  if (locale === 'ca') {
    for (const text of unique) result.set(text, text);
    return result;
  }

  const toFetch: string[] = [];
  for (const original of unique) {
    const cachedByLang = pdfTranslationCache.get(original);
    const cached = cachedByLang?.get(locale);
    if (cached) result.set(original, cached);
    else toFetch.push(original);
  }

  if (toFetch.length === 0) return result;

  try {
    const res = await fetchWithCsrf('/api/admin/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: toFetch,
        targetLanguages: [locale],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      for (const original of toFetch) result.set(original, original);
      return result;
    }

    const translationsByText: Record<string, Record<string, string>> =
      data?.translationsByText || {};

    for (const original of toFetch) {
      const translated = String(translationsByText?.[original]?.[locale] || original);
      let byLang = pdfTranslationCache.get(original);
      if (!byLang) {
        byLang = new Map<Locale, string>();
        pdfTranslationCache.set(original, byLang);
      }
      byLang.set(locale, translated);
      result.set(original, translated);
    }
  } catch (error) {
    log.error('Error translating batch for PDF', error);
    for (const original of toFetch) result.set(original, original);
  }

  return result;
}
