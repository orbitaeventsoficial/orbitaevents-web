import { VAT_RATE_INVOICE, VAT_RATE_NO_INVOICE } from '@/lib/constants/pricing';

export const BOOKING_PAYMENT_METHOD_VALUES = ['TRANSFER', 'CASH', 'INVOICE'] as const;
export type BookingPaymentMethod = (typeof BOOKING_PAYMENT_METHOD_VALUES)[number];

export const DEFAULT_BOOKING_PAYMENT_METHOD: BookingPaymentMethod = 'TRANSFER';

const BOOKING_PAYMENT_METHOD_LABELS: Record<BookingPaymentMethod, string> = {
  TRANSFER: 'Transferència',
  CASH: 'Efectiu',
  INVOICE: 'Administratiu antic',
};

const BOOKING_PAYMENT_METHOD_HELP: Record<BookingPaymentMethod, string> = {
  TRANSFER: 'Canal manual/base de cobrament. Stripe i Bizum són vies per tram i marquen la paga i senyal o la resta quan es confirmen.',
  CASH: 'Cobrament registrat en efectiu.',
  INVOICE: 'Valor llegat: no governa si cal factura ni IVA. La fiscalitat depèn de "Fiscalitat".',
};

export function normalizeBookingPaymentMethod(value: string | null | undefined): BookingPaymentMethod {
  return BOOKING_PAYMENT_METHOD_VALUES.includes(value as BookingPaymentMethod)
    ? (value as BookingPaymentMethod)
    : DEFAULT_BOOKING_PAYMENT_METHOD;
}

export function getBookingPaymentMethodLabel(value: string | null | undefined): string {
  return BOOKING_PAYMENT_METHOD_LABELS[normalizeBookingPaymentMethod(value)];
}

export function getBookingPaymentMethodHelp(value: string | null | undefined): string {
  return BOOKING_PAYMENT_METHOD_HELP[normalizeBookingPaymentMethod(value)];
}

export function getBookingFiscalMode(invoiceRequired: boolean | null | undefined) {
  const required = Boolean(invoiceRequired);
  return {
    label: required ? 'Factura amb IVA' : 'Sense factura',
    vatRate: required ? VAT_RATE_INVOICE : VAT_RATE_NO_INVOICE,
    help: required
      ? 'Genera base imposable i IVA; es pot crear factura.'
      : 'No suma IVA al total i no vol dir que el cobrament sigui "per factura".',
  };
}
