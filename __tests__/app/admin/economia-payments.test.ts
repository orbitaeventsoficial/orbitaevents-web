import { describe, expect, it } from 'vitest';
import {
  buildEconomiaPaymentRow,
  summarizeEconomiaPaymentRows,
  type EconomiaPaymentBookingInput,
} from '@/app/admin/economia/economia-payments';

function makeBooking(overrides: Partial<EconomiaPaymentBookingInput> = {}): EconomiaPaymentBookingInput {
  return {
    id: 'booking-1',
    reference: 'OE-2026-001',
    status: 'CONFIRMED',
    clientName: 'Client Prova',
    clientPhone: '600000000',
    eventDate: new Date('2026-07-08T20:00:00.000Z'),
    total: 3000,
    depositAmount: 1000,
    depositPaid: false,
    depositPaidAt: null,
    remainingAmount: 2000,
    remainingPaid: false,
    remainingPaidAt: null,
    cashAmount: null,
    ...overrides,
  };
}

describe('economia-payments', () => {
  const now = new Date('2026-07-07T10:00:00.000Z');
  const monthStart = new Date('2026-07-01T00:00:00.000Z');

  it('no projecta deute ni risc si cashAmount cobreix tot encara que els flags siguin falsos', () => {
    const row = buildEconomiaPaymentRow(makeBooking({ cashAmount: 3000 }), {
      now,
      paymentFlowState: 'NONE',
    });
    const summary = summarizeEconomiaPaymentRows([row], monthStart);

    expect(row).toMatchObject({
      depositOutstandingAmount: 0,
      remainingOutstandingAmount: 0,
      outstandingAmount: 0,
      depositSettled: true,
      remainingSettled: true,
      overdueDeposit: false,
      overdueRemaining: false,
      dueSoonDeposit: false,
      dueSoonRemaining: false,
    });
    expect(summary.outstandingTotal).toBe(0);
    expect(summary.overdueTotal).toBe(0);
    expect(summary.dueSoonTotal).toBe(0);
    expect(summary.atRiskRows).toEqual([]);
    expect(summary.upcomingDueRows).toEqual([]);
  });

  it('imputa efectiu primer a bestreta i deixa només el saldo real a la cua propera', () => {
    const row = buildEconomiaPaymentRow(makeBooking({
      eventDate: new Date('2026-07-20T20:00:00.000Z'),
      cashAmount: 1000,
    }), {
      now,
      paymentFlowState: 'NONE',
    });
    const summary = summarizeEconomiaPaymentRows([row], monthStart);

    expect(row).toMatchObject({
      depositOutstandingAmount: 0,
      remainingOutstandingAmount: 2000,
      outstandingAmount: 2000,
      depositSettled: true,
      remainingSettled: false,
      overdueDeposit: false,
      overdueRemaining: false,
      dueSoonDeposit: false,
      dueSoonRemaining: true,
    });
    expect(summary.outstandingTotal).toBe(2000);
    expect(summary.overdueTotal).toBe(0);
    expect(summary.dueSoonTotal).toBe(2000);
    expect(summary.atRiskRows).toEqual([]);
    expect(summary.upcomingDueRows.map((item) => item.id)).toEqual(['booking-1']);
  });
});
