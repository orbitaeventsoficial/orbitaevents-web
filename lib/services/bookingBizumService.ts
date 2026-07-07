import { prisma } from '@/lib/prisma';
import { findPortalAccessByRawToken } from '@/lib/services/clientPortalAccess';
import { bookingOutstandingBreakdown } from '@/lib/payment-status';

export type BizumNotifyResult =
  | { ok: true }
  | { ok: false; reason: 'INVALID_TOKEN' | 'NOT_FOUND' | 'ALREADY_PAID' | 'ALREADY_DECLARED' };

export type BizumConfirmResult =
  | { ok: true }
  | { ok: false; reason: 'NOT_FOUND' | 'ALREADY_PAID' | 'NO_DECLARATION' };

export async function declareBizumPayment(input: {
  rawToken: string;
  paymentType: 'deposit' | 'remaining';
}): Promise<BizumNotifyResult> {
  const access = await findPortalAccessByRawToken(input.rawToken);
  if (!access) return { ok: false, reason: 'INVALID_TOKEN' };

  const booking = await prisma.booking.findUnique({
    where: { id: access.bookingId },
    select: {
      id: true,
      total: true,
      depositAmount: true,
      remainingAmount: true,
      depositPaid: true,
      remainingPaid: true,
      cashAmount: true,
      depositBizumDeclaredAt: true,
      remainingBizumDeclaredAt: true,
    },
  });
  if (!booking) return { ok: false, reason: 'NOT_FOUND' };
  const outstanding = bookingOutstandingBreakdown(booking);

  if (input.paymentType === 'deposit') {
    if (outstanding.depositAmount <= 0) return { ok: false, reason: 'ALREADY_PAID' };
    if (booking.depositBizumDeclaredAt) return { ok: false, reason: 'ALREADY_DECLARED' };
    await prisma.booking.update({
      where: { id: booking.id },
      data: { depositBizumDeclaredAt: new Date() },
    });
  } else {
    if (outstanding.remainingAmount <= 0) return { ok: false, reason: 'ALREADY_PAID' };
    if (booking.remainingBizumDeclaredAt) return { ok: false, reason: 'ALREADY_DECLARED' };
    await prisma.booking.update({
      where: { id: booking.id },
      data: { remainingBizumDeclaredAt: new Date() },
    });
  }

  await prisma.adminLog.create({
    data: {
      action: 'BIZUM_DECLARED',
      entity: 'booking',
      entityId: booking.id,
      details: { paymentType: input.paymentType, source: 'portal' },
    },
  });

  return { ok: true };
}

export async function confirmBizumPayment(input: {
  bookingId: string;
  paymentType: 'deposit' | 'remaining';
}): Promise<BizumConfirmResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      id: true,
      total: true,
      depositAmount: true,
      remainingAmount: true,
      depositPaid: true,
      remainingPaid: true,
      cashAmount: true,
      depositBizumDeclaredAt: true,
      remainingBizumDeclaredAt: true,
    },
  });
  if (!booking) return { ok: false, reason: 'NOT_FOUND' };
  const outstanding = bookingOutstandingBreakdown(booking);

  if (input.paymentType === 'deposit') {
    if (outstanding.depositAmount <= 0) return { ok: false, reason: 'ALREADY_PAID' };
    if (!booking.depositBizumDeclaredAt) return { ok: false, reason: 'NO_DECLARATION' };
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        depositPaid: true,
        depositPaidAt: new Date(),
        depositBizumDeclaredAt: null,
      },
    });
  } else {
    if (outstanding.remainingAmount <= 0) return { ok: false, reason: 'ALREADY_PAID' };
    if (!booking.remainingBizumDeclaredAt) return { ok: false, reason: 'NO_DECLARATION' };
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        remainingPaid: true,
        remainingPaidAt: new Date(),
        remainingBizumDeclaredAt: null,
      },
    });
  }

  await prisma.adminLog.create({
    data: {
      action: 'BIZUM_CONFIRMED',
      entity: 'booking',
      entityId: booking.id,
      details: { paymentType: input.paymentType, source: 'admin' },
    },
  });

  return { ok: true };
}
