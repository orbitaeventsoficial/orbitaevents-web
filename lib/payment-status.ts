/**
 * Estat de pagament d'una reserva — FONT ÚNICA de label i to.
 *
 * Regla canònica (CLAUDE.md): depositPaid && remainingPaid = verd (Pagat),
 * depositPaid = groc (Parcial), cap = vermell (Pendent).
 * Qualsevol pantalla que mostri l'estat de pagament ha de derivar d'aquí
 * per no divergir (abans la fitxa deia «Completat» i la llista «Pagat»).
 */

export type PaymentBand = 'paid' | 'partial' | 'pending';

export function getPaymentBand(depositPaid: boolean, remainingPaid: boolean): PaymentBand {
  if (depositPaid && remainingPaid) return 'paid';
  if (depositPaid) return 'partial';
  return 'pending';
}

const PAYMENT_LABEL: Record<PaymentBand, string> = {
  paid: 'Pagat',
  partial: 'Parcial',
  pending: 'Pendent',
};

export function getPaymentLabel(depositPaid: boolean, remainingPaid: boolean): string {
  return PAYMENT_LABEL[getPaymentBand(depositPaid, remainingPaid)];
}

/** Classe de to admin (text) per a l'estat de pagament. */
export function getPaymentTextClass(depositPaid: boolean, remainingPaid: boolean): string {
  const band = getPaymentBand(depositPaid, remainingPaid);
  return band === 'paid' ? 'admin-tone-text-success' : band === 'partial' ? 'admin-tone-text-warning' : 'admin-tone-text-danger';
}

/** Classe de to admin (punt/fons) per a l'estat de pagament. */
export function getPaymentDotClass(depositPaid: boolean, remainingPaid: boolean): string {
  const band = getPaymentBand(depositPaid, remainingPaid);
  return band === 'paid' ? 'admin-tone-bg-success' : band === 'partial' ? 'admin-tone-bg-warning' : 'admin-tone-bg-danger';
}
