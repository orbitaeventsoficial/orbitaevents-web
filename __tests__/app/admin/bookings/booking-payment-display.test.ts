import { describe, expect, it } from 'vitest';

import { resolveBookingPaymentDisplay } from '@/app/admin/bookings/[id]/booking-payment-display';

describe('booking payment display', () => {
  it('manté imports nominals quan els flags ja estan pagats', () => {
    expect(resolveBookingPaymentDisplay({
      total: 1000,
      depositAmount: 300,
      remainingAmount: 700,
      depositPaid: true,
      remainingPaid: true,
      cashAmount: null,
    })).toEqual({
      depositSettled: true,
      remainingSettled: true,
      allSettled: true,
      depositAmount: 300,
      remainingAmount: 700,
    });
  });

  it('marca la bestreta liquidada si cashAmount la cobreix', () => {
    expect(resolveBookingPaymentDisplay({
      total: 1000,
      depositAmount: 300,
      remainingAmount: 700,
      depositPaid: false,
      remainingPaid: false,
      cashAmount: 300,
    })).toEqual({
      depositSettled: true,
      remainingSettled: false,
      allSettled: false,
      depositAmount: 300,
      remainingAmount: 700,
    });
  });

  it('mostra import pendent real quan cashAmount nomes cobreix part de la bestreta', () => {
    expect(resolveBookingPaymentDisplay({
      total: 1000,
      depositAmount: 300,
      remainingAmount: 700,
      depositPaid: false,
      remainingPaid: false,
      cashAmount: 125,
    })).toMatchObject({
      depositSettled: false,
      remainingSettled: false,
      allSettled: false,
      depositAmount: 175,
      remainingAmount: 700,
    });
  });
});
