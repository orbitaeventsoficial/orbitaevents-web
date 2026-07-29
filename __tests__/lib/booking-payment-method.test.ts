import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOOKING_PAYMENT_METHOD,
  getBookingFiscalMode,
  getBookingPaymentMethodHelp,
  getBookingPaymentMethodLabel,
  normalizeBookingPaymentMethod,
} from '@/lib/constants/booking-payment';

describe('booking-payment-method', () => {
  it('normalitza valors desconeguts al mètode per defecte', () => {
    expect(DEFAULT_BOOKING_PAYMENT_METHOD).toBe('TRANSFER');
    expect(normalizeBookingPaymentMethod(null)).toBe('TRANSFER');
    expect(normalizeBookingPaymentMethod('')).toBe('TRANSFER');
    expect(normalizeBookingPaymentMethod('STRIPE')).toBe('TRANSFER');
    expect(normalizeBookingPaymentMethod('BIZUM')).toBe('TRANSFER');
  });

  it('separa el canal de cobrament de la fiscalitat', () => {
    expect(getBookingPaymentMethodLabel('TRANSFER')).toBe('Transferència');
    expect(getBookingPaymentMethodHelp('TRANSFER')).toContain('Stripe i Bizum són vies per tram');
    expect(getBookingPaymentMethodLabel('INVOICE')).toBe('Administratiu antic');
    expect(getBookingPaymentMethodHelp('INVOICE')).toContain('no governa si cal factura');
    expect(getBookingFiscalMode(false)).toEqual(expect.objectContaining({
      label: 'Sense factura',
      vatRate: 0,
    }));
    expect(getBookingFiscalMode(true)).toEqual(expect.objectContaining({
      label: 'Factura amb IVA',
      vatRate: 21,
    }));
  });
});
