import { prisma } from '@/lib/prisma';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { createStripeCheckoutSession, constructStripeEvent, StripeNotConfiguredError, type StripePaymentType } from '@/lib/services/stripeService';
import { normalizePortalLocale } from '@/lib/services/clientPortalAccess';
import { bookingOutstandingBreakdown } from '@/lib/payment-status';

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2002';
}

export class StripeWebhookSignatureError extends Error {
  constructor() {
    super('Invalid Stripe webhook signature');
    this.name = 'StripeWebhookSignatureError';
  }
}

export type BookingStripeCheckoutResult =
  | { status: 200; body: { url: string } }
  | { status: 400 | 404 | 409 | 500; body: { error: string } };

function amountsMatch(left: number, right: number): boolean {
  return Math.round(left * 100) === Math.round(right * 100);
}

export async function createBookingStripeCheckoutLink(input: {
  bookingId: string;
  paymentType: StripePaymentType;
  baseUrl?: string;
}): Promise<BookingStripeCheckoutResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      id: true,
      reference: true,
      clientEmail: true,
      total: true,
      depositAmount: true,
      depositPaid: true,
      remainingAmount: true,
      remainingPaid: true,
      cashAmount: true,
    },
  });

  if (!booking) return { status: 404, body: { error: 'NOT_FOUND' } };
  const outstanding = bookingOutstandingBreakdown({
    total: booking.total,
    depositAmount: booking.depositAmount,
    remainingAmount: booking.remainingAmount,
    depositPaid: booking.depositPaid,
    remainingPaid: booking.remainingPaid,
    cashAmount: booking.cashAmount,
  });

  const baseUrl = input.baseUrl ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'https://orbitaevents.com';

  const portalAccess = await prisma.clientPortalAccess.findFirst({
    where: { bookingId: input.bookingId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { locale: true },
  });
  const portalLocale = normalizePortalLocale(portalAccess?.locale ?? null);
  const ref = encodeURIComponent(booking.reference);
  const successUrl = `${baseUrl}/${portalLocale}/portal/payment-success?type=${input.paymentType}&ref=${ref}`;
  const cancelUrl = `${baseUrl}${buildBookingHref(booking.id)}`;

  if (input.paymentType === 'deposit') {
    if (outstanding.depositAmount <= 0) return { status: 409, body: { error: 'ALREADY_PAID' } };
    if (!amountsMatch(outstanding.depositAmount, booking.depositAmount)) {
      return { status: 409, body: { error: 'PARTIAL_CASH_REQUIRES_MANUAL' } };
    }

    try {
      const stripeResult = await createStripeCheckoutSession({
        bookingId: booking.id,
        paymentType: 'deposit',
        amountEur: booking.depositAmount,
        clientEmail: booking.clientEmail,
        description: `Paga i senyal — Reserva ${booking.reference}`,
        successUrl,
        cancelUrl,
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: { depositPaymentUrl: stripeResult.url },
      });

      return { status: 200, body: { url: stripeResult.url } };
    } catch (error) {
      if (error instanceof StripeNotConfiguredError) {
        return { status: 500, body: { error: 'STRIPE_NOT_CONFIGURED' } };
      }
      return { status: 500, body: { error: 'STRIPE_ERROR' } };
    }
  }

  if (outstanding.depositAmount > 0) return { status: 409, body: { error: 'DEPOSIT_NOT_PAID' } };
  if (outstanding.remainingAmount <= 0) return { status: 409, body: { error: 'ALREADY_PAID' } };
  if (!amountsMatch(outstanding.remainingAmount, booking.remainingAmount)) {
    return { status: 409, body: { error: 'PARTIAL_CASH_REQUIRES_MANUAL' } };
  }

  try {
    const stripeResult = await createStripeCheckoutSession({
      bookingId: booking.id,
      paymentType: 'remaining',
      amountEur: booking.remainingAmount,
      clientEmail: booking.clientEmail,
      description: `Pagament final — Reserva ${booking.reference}`,
      successUrl,
      cancelUrl,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { remainingPaymentUrl: stripeResult.url },
    });

    return { status: 200, body: { url: stripeResult.url } };
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return { status: 500, body: { error: 'STRIPE_NOT_CONFIGURED' } };
    }
    return { status: 500, body: { error: 'STRIPE_ERROR' } };
  }
}

export async function processStripeWebhook(input: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): Promise<{ received: true }> {
  let event: ReturnType<typeof constructStripeEvent>;
  try {
    event = constructStripeEvent(input.rawBody, input.signature, input.webhookSecret);
  } catch {
    throw new StripeWebhookSignatureError();
  }

  const stripeEvent = event as ReturnType<typeof constructStripeEvent> & { id?: string };
  const eventId = stripeEvent.id ?? null;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id?: string;
      amount_total?: number | null;
      metadata?: Record<string, string> | null;
    };
    const bookingId = session.metadata?.bookingId;
    const paymentType = session.metadata?.paymentType;

    try {
      await prisma.$transaction(async (tx) => {
        if (eventId) {
          await tx.stripeWebhookEvent.create({
            data: {
              eventId,
              type: event.type,
              bookingId: bookingId ?? null,
              paymentType: paymentType ?? null,
              stripeSessionId: session.id ?? null,
            },
          });
        }

        if (bookingId && paymentType === 'deposit') {
          await tx.booking.update({
            where: { id: bookingId },
            data: { depositPaid: true, depositPaidAt: new Date() },
          });
          await tx.adminLog.create({
            data: {
              action: 'PAYMENT_RECORDED',
              entity: 'booking',
              entityId: bookingId,
              details: {
                message: 'Pagament Stripe registrat: paga i senyal',
                source: 'stripe',
                paymentType: 'deposit',
                stripeSessionId: session.id ?? null,
                amountCents: session.amount_total ?? null,
              },
            },
          });
        } else if (bookingId && paymentType === 'remaining') {
          await tx.booking.update({
            where: { id: bookingId },
            data: { remainingPaid: true, remainingPaidAt: new Date() },
          });
          await tx.adminLog.create({
            data: {
              action: 'PAYMENT_RECORDED',
              entity: 'booking',
              entityId: bookingId,
              details: {
                message: 'Pagament Stripe registrat: resta',
                source: 'stripe',
                paymentType: 'remaining',
                stripeSessionId: session.id ?? null,
                amountCents: session.amount_total ?? null,
              },
            },
          });
        }
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) return { received: true };
      throw error;
    }
  } else if (eventId) {
    try {
      await prisma.stripeWebhookEvent.create({
        data: { eventId, type: event.type },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) return { received: true };
      throw error;
    }
  }

  return { received: true };
}
