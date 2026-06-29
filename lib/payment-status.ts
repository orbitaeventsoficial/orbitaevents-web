/**
 * Estat de pagament d'una reserva — FONT ÚNICA de label i to.
 *
 * Regla canònica (CLAUDE.md): depositPaid && remainingPaid = verd (Pagat),
 * qualsevol tram pagat = groc (Parcial), cap = vermell (Pendent). Si hi ha
 * efectiu registrat, `cashAmount` també compta com a cobertura real.
 * Qualsevol pantalla que mostri l'estat de pagament ha de derivar d'aquí
 * per no divergir (abans la fitxa deia «Completat» i la llista «Pagat»).
 */

export type PaymentBand = 'paid' | 'partial' | 'pending';

export type PaymentCoverageInput = {
  cashAmount?: number | null;
  total?: number | null;
};

function normalizeAmount(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function getPaymentBand(depositPaid: boolean, remainingPaid: boolean, coverage?: PaymentCoverageInput): PaymentBand {
  if (depositPaid && remainingPaid) return 'paid';
  const cashAmount = normalizeAmount(coverage?.cashAmount);
  const total = normalizeAmount(coverage?.total);
  if (cashAmount > 0 && total > 0 && cashAmount >= total) return 'paid';
  if (depositPaid || remainingPaid) return 'partial';
  if (cashAmount > 0) return 'partial';
  return 'pending';
}

const PAYMENT_LABEL: Record<PaymentBand, string> = {
  paid: 'Pagat',
  partial: 'Parcial',
  pending: 'Pendent',
};

export function getPaymentLabel(depositPaid: boolean, remainingPaid: boolean, coverage?: PaymentCoverageInput): string {
  return PAYMENT_LABEL[getPaymentBand(depositPaid, remainingPaid, coverage)];
}

/** Classe de to admin (text) per a l'estat de pagament. */
export function getPaymentTextClass(depositPaid: boolean, remainingPaid: boolean, coverage?: PaymentCoverageInput): string {
  const band = getPaymentBand(depositPaid, remainingPaid, coverage);
  return band === 'paid' ? 'admin-tone-text-success' : band === 'partial' ? 'admin-tone-text-warning' : 'admin-tone-text-danger';
}

/** Classe de to admin (punt/fons) per a l'estat de pagament. */
export function getPaymentDotClass(depositPaid: boolean, remainingPaid: boolean, coverage?: PaymentCoverageInput): string {
  const band = getPaymentBand(depositPaid, remainingPaid, coverage);
  return band === 'paid' ? 'admin-tone-bg-success' : band === 'partial' ? 'admin-tone-bg-warning' : 'admin-tone-bg-danger';
}
