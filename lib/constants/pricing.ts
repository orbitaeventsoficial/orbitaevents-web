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

/** Helpers derivats */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
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
