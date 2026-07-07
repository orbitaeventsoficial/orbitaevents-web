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

export type BookingOutstandingBreakdown = {
  depositAmount: number;
  remainingAmount: number;
  total: number;
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

/**
 * Import PENDENT de cobrar d'una reserva (font única). Regla canònica: si la bestreta
 * no s'ha cobrat, es deu; si el saldo restant no s'ha cobrat, es deu (total − bestreta).
 * **L'efectiu ja cobrat (`cashAmount`, paymentMethod=CASH) redueix el pendent** — al negoci
 * el normal és cobrar-ho tot en efectiu el mateix dia del bolo, així que un bolo pagat en
 * efectiu NO és deute encara que els flags online (depositPaid/remainingPaid) siguin false.
 * Coherent amb `getPaymentBand` (que ja tracta cashAmount ≥ total com a «pagat»).
 * Consolidat aquí perquè cap pantalla reimplementi la fórmula.
 */
export function bookingOutstandingAmount(booking: {
  total: number;
  depositAmount: number;
  remainingAmount?: number | null;
  depositPaid: boolean;
  remainingPaid: boolean;
  cashAmount?: number | null;
}): number {
  return bookingOutstandingBreakdown(booking).total;
}

export function bookingOutstandingBreakdown(booking: {
  total: number;
  depositAmount: number;
  remainingAmount?: number | null;
  depositPaid: boolean;
  remainingPaid: boolean;
  cashAmount?: number | null;
}): BookingOutstandingBreakdown {
  const total = normalizeAmount(booking.total);
  const deposit = normalizeAmount(booking.depositAmount);
  const remaining = typeof booking.remainingAmount === 'number' && Number.isFinite(booking.remainingAmount)
    ? normalizeAmount(booking.remainingAmount)
    : Math.max(0, total - deposit);
  let cash = normalizeAmount(booking.cashAmount);
  let pendingDeposit = booking.depositPaid ? 0 : deposit;
  let pendingRemaining = booking.remainingPaid ? 0 : remaining;

  const cashForDeposit = Math.min(pendingDeposit, cash);
  pendingDeposit = Math.max(0, pendingDeposit - cashForDeposit);
  cash = Math.max(0, cash - cashForDeposit);

  const cashForRemaining = Math.min(pendingRemaining, cash);
  pendingRemaining = Math.max(0, pendingRemaining - cashForRemaining);

  const depositAmount = Math.round(pendingDeposit * 100) / 100;
  const remainingAmount = Math.round(pendingRemaining * 100) / 100;
  return {
    depositAmount,
    remainingAmount,
    total: Math.round((depositAmount + remainingAmount) * 100) / 100,
  };
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
