/**
 * Tipus, constants i helpers purs per al configurador.
 * Extret de client.tsx per reduir la mida del component principal.
 */

import { OFFERS, type ExtraDefinition, type PackDefinition, type ServiceSlug } from '@/config/packs-config';
import { resolvePackI18nKey } from '@/lib/pack-i18n';

// ─── Types ──────────────────────────────────────────────────────────────────

export type EventType = 'bodas' | 'discomovil' | 'fiestas' | 'empresas';

export interface ConfigState {
  eventType: EventType | null;
  selectedPack: PackDefinition | null;
  date: string;
  guests: number;
  extras: string[];
  appliedOffer: string | null;
}

export interface AppliedDiscountCode {
  code: string;
  source: 'customer' | 'global' | 'feedback';
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  expiresAt: string;
  isAccumulative?: boolean;
}

export interface PricingSummary {
  basePrice: number;
  extrasPrice: number;
  subtotal: number;
  discount: number;
  discountReason: string;
  total: number;
}

export interface ClosingPricingSummary {
  earlyBirdDiscount: number;
  priceWithoutDiscount: number;
  finalPrice: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const EVENT_TYPE_SERVICE_MAP: Record<EventType, ServiceSlug[]> = {
  bodas: ['bodas'],
  discomovil: ['discomovil'],
  fiestas: ['fiestas', 'discomovil'],
  empresas: ['empresas'],
};

export const EVENT_TYPE_CARDS: Array<{
  slug: EventType;
  icon: string;
  idealKey: 'step1.idealBodas' | 'step1.idealFiestas' | 'step1.idealDiscomovil' | 'step1.idealEmpresas';
}> = [
  { slug: 'bodas', icon: '💒', idealKey: 'step1.idealBodas' },
  { slug: 'fiestas', icon: '🎉', idealKey: 'step1.idealFiestas' },
  { slug: 'discomovil', icon: '🎵', idealKey: 'step1.idealDiscomovil' },
  { slug: 'empresas', icon: '💼', idealKey: 'step1.idealEmpresas' },
];

export const EVENT_AMBIENTS: Record<EventType, { glow: string; gradient: string; accent: string; accentBorder: string }> = {
  bodas: { glow: 'rgba(244,63,94,0.08)', gradient: 'from-rose-500/10 via-pink-500/5 to-transparent', accent: 'text-rose-400', accentBorder: 'border-rose-500/30' },
  fiestas: { glow: 'rgba(217,70,239,0.08)', gradient: 'from-purple-500/10 via-fuchsia-500/5 to-transparent', accent: 'text-fuchsia-400', accentBorder: 'border-fuchsia-500/30' },
  discomovil: { glow: 'rgba(34,211,238,0.08)', gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent', accent: 'text-cyan-400', accentBorder: 'border-cyan-500/30' },
  empresas: { glow: 'rgba(59,130,246,0.08)', gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent', accent: 'text-blue-400', accentBorder: 'border-blue-500/30' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getPacksForEventType(packs: PackDefinition[], eventType: EventType | null): PackDefinition[] {
  if (!eventType) return [];

  const allowedServices = EVENT_TYPE_SERVICE_MAP[eventType];
  const deduped = new Map<string, PackDefinition>();

  for (const pack of packs) {
    if (!allowedServices.includes(pack.service)) continue;
    const key = pack.slug || pack.id;
    if (!deduped.has(key)) {
      deduped.set(key, pack);
    }
  }

  return Array.from(deduped.values());
}

export function getMinPriceForEventType(packs: PackDefinition[], eventType: EventType): number {
  const availablePacks = getPacksForEventType(packs, eventType);
  return availablePacks.length > 0 ? Math.min(...availablePacks.map((pack) => pack.priceValue)) : 0;
}

export function calculatePricingSummary(
  config: ConfigState,
  extrasCatalog: ExtraDefinition[],
  appliedDiscountCode: AppliedDiscountCode | null,
  discountCodeReason: string,
  locale: string,
): PricingSummary {
  const basePrice = config.selectedPack?.priceValue || 0;
  const extrasPrice = config.extras.reduce((sum, extraId) => {
    const extra = extrasCatalog.find((candidate) => candidate.id === extraId);
    return sum + (extra?.price || 0);
  }, 0);
  const subtotal = basePrice + extrasPrice;
  const applicableOffers: Array<{ discount: number; reason: string }> = [];

  if (config.appliedOffer === 'early-bird' && subtotal >= (OFFERS.earlyBird.minAmount || 0)) {
    applicableOffers.push({
      discount: Math.round((subtotal * (OFFERS.earlyBird.discount || 0)) / 100),
      reason: resolvePackI18nKey(OFFERS.earlyBird.name, locale) || OFFERS.earlyBird.name,
    });
  }

  if (config.extras.length >= (OFFERS.combo.minExtras || 3)) {
    applicableOffers.push({
      discount: Math.round((extrasPrice * (OFFERS.combo.discount || 0)) / 100),
      reason: resolvePackI18nKey(OFFERS.combo.name, locale) || OFFERS.combo.name,
    });
  }

  if (config.date) {
    const eventMonth = new Date(config.date).getMonth() + 1;
    const seasonalMonths: readonly number[] = OFFERS.seasonal.months ?? [];
    if (seasonalMonths.includes(eventMonth)) {
      applicableOffers.push({
        discount: Math.round((subtotal * (OFFERS.seasonal.discount || 0)) / 100),
        reason: resolvePackI18nKey(OFFERS.seasonal.name, locale) || OFFERS.seasonal.name,
      });
    }
  }

  if (appliedDiscountCode) {
    const codeDiscount =
      appliedDiscountCode.type === 'PERCENTAGE'
        ? Math.round((subtotal * appliedDiscountCode.value) / 100)
        : Math.round(appliedDiscountCode.value);

    if (codeDiscount > 0) {
      applicableOffers.push({
        discount: codeDiscount,
        reason: discountCodeReason,
      });
    }
  }

  const bestOffer = applicableOffers.sort((a, b) => b.discount - a.discount)[0];
  const discount = bestOffer?.discount || 0;
  const discountReason = bestOffer?.reason || '';

  return {
    basePrice,
    extrasPrice,
    subtotal,
    discount,
    discountReason,
    total: subtotal - discount,
  };
}

export function calculateClosingPricing(pricing: PricingSummary): ClosingPricingSummary {
  const potentialEarlyBird = Math.round((pricing.subtotal * (OFFERS.earlyBird.discount || 10)) / 100);
  const earlyBirdDiscount = Math.max(pricing.discount, potentialEarlyBird);

  return {
    earlyBirdDiscount,
    priceWithoutDiscount: pricing.subtotal,
    finalPrice: pricing.subtotal - earlyBirdDiscount,
  };
}

export function toggleExtraSelection(selectedExtras: string[], extraId: string, checked: boolean): string[] {
  if (checked) {
    return selectedExtras.includes(extraId) ? selectedExtras : [...selectedExtras, extraId];
  }
  return selectedExtras.filter((id) => id !== extraId);
}

export function filterUnavailableExtras(selectedExtras: string[], availableExtras: ExtraDefinition[]): string[] {
  const allowed = new Set(availableExtras.map((extra) => extra.id));
  return selectedExtras.filter((id) => allowed.has(id));
}

export function getSelectedExtraNames(extraIds: string[], extrasCatalog: ExtraDefinition[]): string[] {
  return extraIds
    .map((id) => extrasCatalog.find((extra) => extra.id === id)?.name)
    .filter(Boolean) as string[];
}


