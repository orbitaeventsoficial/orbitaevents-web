import { bookingOutstandingBreakdown } from '@/lib/payment-status';

export type BookingPaymentDisplayInput = {
  total: number;
  depositAmount: number;
  remainingAmount: number;
  depositPaid: boolean;
  remainingPaid: boolean;
  cashAmount?: number | null;
};

export type BookingPaymentDisplay = {
  depositSettled: boolean;
  remainingSettled: boolean;
  allSettled: boolean;
  depositAmount: number;
  remainingAmount: number;
};

export function resolveBookingPaymentDisplay(input: BookingPaymentDisplayInput): BookingPaymentDisplay {
  const breakdown = bookingOutstandingBreakdown(input);
  const depositSettled = breakdown.depositAmount <= 0;
  const remainingSettled = breakdown.remainingAmount <= 0;

  return {
    depositSettled,
    remainingSettled,
    allSettled: breakdown.total <= 0,
    depositAmount: depositSettled ? input.depositAmount : breakdown.depositAmount,
    remainingAmount: remainingSettled ? input.remainingAmount : breakdown.remainingAmount,
  };
}
