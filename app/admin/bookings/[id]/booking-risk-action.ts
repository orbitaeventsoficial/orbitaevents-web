import type { BookingOutstandingBand } from '@/app/admin/lib/booking-economic-guard';
import type { MarginBand } from '@/lib/margin-utils';

export type BookingRiskActionTone = 'warning' | 'danger';

export type BookingRiskAction = {
  key: 'finance' | 'margin';
  tone: BookingRiskActionTone;
  eyebrow: string;
  title: string;
  summary: string;
  metricLabel: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function resolveBookingFinanceRiskAction(input: {
  outstandingAmount: number;
  outstandingBand: BookingOutstandingBand;
  depositPaid: boolean;
  remainingPaid: boolean;
  cashAmount?: number | null;
  total: number;
}): BookingRiskAction | null {
  if (input.outstandingAmount <= 0 || input.outstandingBand === 'ok') return null;

  const tone: BookingRiskActionTone = input.outstandingBand === 'err' ? 'danger' : 'warning';
  const hasPartialCash = typeof input.cashAmount === 'number'
    && input.cashAmount > 0
    && input.cashAmount < input.total;
  const bothPending = !input.depositPaid && !input.remainingPaid;

  let summary = 'El guard econòmic detecta caixa pendent. Revisa els controls de pagament abans de donar la reserva per tancada.';
  if (bothPending) {
    summary = 'Paga i senyal i resta encara no consten cobrades. Confirma només el que hagis vist al banc o usa els enllaços de pagament.';
  } else if (!input.depositPaid) {
    summary = 'La paga i senyal continua pendent. Confirma-la només quan el cobrament sigui real.';
  } else if (!input.remainingPaid) {
    summary = 'La resta continua pendent. Confirma-la, registra efectiu o envia l’enllaç quan toqui.';
  } else if (hasPartialCash) {
    summary = 'Hi ha efectiu parcial registrat, però encara queda import per conciliar.';
  }

  return {
    key: 'finance',
    tone,
    eyebrow: 'Acció recomanada',
    title: tone === 'danger' ? 'Risc alt de cobrament pendent' : 'Cobrament pendent a revisar',
    summary,
    metricLabel: 'Pendent',
    primaryHref: '#booking-payment-status',
    primaryLabel: 'Revisar pagaments',
    secondaryHref: '#booking-payment-links',
    secondaryLabel: 'Enllaços / Bizum',
  };
}

export function resolveBookingMarginRiskAction(input: {
  marginBand: MarginBand;
}): BookingRiskAction | null {
  if (input.marginBand !== 'critical' && input.marginBand !== 'watch') return null;

  const critical = input.marginBand === 'critical';
  return {
    key: 'margin',
    tone: critical ? 'danger' : 'warning',
    eyebrow: 'Acció recomanada',
    title: critical ? 'Marge crític a corregir' : 'Marge just a vigilar',
    summary: critical
      ? 'El marge està per sota del mínim del semàfor. Revisa total, serveis externs i desplaçament abans de donar el bolo per resolt.'
      : 'El marge és viable però fràgil. Revisa si el total, els serveis externs o el transport expliquen la pressió.',
    metricLabel: 'Marge',
    primaryHref: '#booking-margin-costs',
    primaryLabel: 'Veure costos',
    secondaryHref: '#sec-finances',
    secondaryLabel: 'Revisar total',
  };
}
