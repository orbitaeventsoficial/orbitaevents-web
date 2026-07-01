/**
 * pricing.ts — Font canònica de totes les constants de preu i fiscals.
 *
 * Qualsevol canvi de IVA, depòsit o ràtio de cost ha de venir aquí.
 * Cap fitxer pot hardcodejar 21, 0.3, 0.36, 0.28, 0.2 o 45 directament.
 */

/** IVA aplicable quan el client vol factura (%) */
export const VAT_RATE_INVOICE = 21;

/** IVA quan no hi ha factura (tractament exempt) */
export const VAT_RATE_NO_INVOICE = 0;

/** Percentatge del total que es cobra com a paga i senyal (0-1) */
export const DEPOSIT_RATIO = 0.30;

/** Mateix percentatge expressat com a valor UI/API (0-100) */
export const DEPOSIT_PERCENT = DEPOSIT_RATIO * 100;

/** Preu mínim per hora d'operari extra (€) */
export const OPERATOR_EXTRA_MIN_PRICE = 25;

/** Factor sobre preu hora extra del pack per calcular preu operari */
export const OPERATOR_EXTRA_FACTOR   = 0.6;

/** Slug canònic del pack tècnic "Personalitzat" (bolo muntat per línies, sense pack de catàleg). */
export const CUSTOM_BOOKING_PACK_SLUG = 'personalitzat';

/** Marcador que el formulari de nova reserva envia quan no es tria cap pack de catàleg. */
export const CUSTOM_BOOKING_PACK_MARKER = '__custom__';

/** Camps que formen un bloc econòmic coherent de proposta. */
export const PROPOSAL_FINANCIAL_FIELDS = ['subtotal', 'discount', 'vatRate', 'vatAmount', 'total'] as const;

/** Helpers derivats */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Increment per defecte de revenda de serveis de proveïdor (sobre el cost). */
export const RESELL_MARKUP = 0.20;

/** Arrodoneix un import a l'alça al múltiple de `step` (per defecte 5 → preus acabats en 0 o 5). */
export function ceilToStep(amount: number, step = 5): number {
  if (step <= 0) return amount;
  return Math.ceil(amount / step) * step;
}

/** Preu de venda canònic d'un servei revenut: cost + marge, arrodonit a l'alça a múltiple de 5. */
export function resellPrice(cost: number, markup = RESELL_MARKUP, step = 5): number {
  return ceilToStep(cost * (1 + markup), step);
}

export function calcDeposit(total: number): number {
  return Math.round(total * DEPOSIT_RATIO);
}

export function calcVatAmount(base: number, invoiceRequired: boolean): number {
  const rate = invoiceRequired ? VAT_RATE_INVOICE : VAT_RATE_NO_INVOICE;
  return roundMoney(base * (rate / 100));
}

export function calcVatRate(invoiceRequired: boolean): number {
  return invoiceRequired ? VAT_RATE_INVOICE : VAT_RATE_NO_INVOICE;
}
