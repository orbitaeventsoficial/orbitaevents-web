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
import { ADMIN_PDF_STUDIO_COPY, ADMIN_PDF_STUDIO_CUSTOM_PACK_ID, ADMIN_PDF_STUDIO_DEFAULT_SECTION_ORDER, ADMIN_PDF_STUDIO_DRAFT_KEY, ADMIN_PDF_STUDIO_OPERATOR_EXTRA_ID, ADMIN_PDF_STUDIO_SECTION_LABELS, ADMIN_PDF_STUDIO_SERVICE_LABELS } from '@/lib/constants/admin';
import { formatCurrencyExact } from '@/lib/constants';
import { log } from '@/lib/logger';

// --- Types --------------------------------------------------------------

export type DocMode = 'quote' | 'contract';

export type SectionId = 'config' | 'client' | 'brand' | 'pack' | 'extras-catalog' | 'extras-custom' | 'contract';

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
  initialEventDate?: string;
  initialEventSchedule?: string;
  initialEventLocation?: string;
  initialGuests?: number;
  initialLeadId?: string;
  initialProposalId?: string;
  initialPreferredLocale?: string;
  initialBrandName?: string;
  initialBrandWebsite?: string;
  initialBrandEmail?: string;
  initialBrandPhone?: string;
  initialBrandTagline?: string;
  initialBrandLogoDataUrl?: string;
};

// --- Constants ----------------------------------------------------------

export const SECTION_LABELS: Record<SectionId, string> = ADMIN_PDF_STUDIO_SECTION_LABELS;

export const DEFAULT_SECTION_ORDER: SectionId[] = [...ADMIN_PDF_STUDIO_DEFAULT_SECTION_ORDER];

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
