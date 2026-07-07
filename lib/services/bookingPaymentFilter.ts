import { BookingStatus, EventType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  ADMIN_BOOKING_DEPOSIT_DUE_DAYS,
  ADMIN_BOOKING_PAYMENT_FILTER_OPTIONS,
  ADMIN_ECONOMY_PAYMENT_DUE_SOON_DAYS,
} from '@/lib/constants/admin';

export type BookingPaymentFilter = 'deposit-pending' | 'overdue' | 'due-soon';

export interface BookingSearchParams {
  page?: string | null;
  status?: string | null;
  eventType?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
  view?: string | null;
  payment?: string | null;
  customerId?: string | null;
}

type BookingMoneyFieldRef = (typeof prisma.booking.fields)['depositAmount'];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolveBookingStatus(value?: string | null) {
  return value && Object.values(BookingStatus).includes(value as BookingStatus)
    ? (value as BookingStatus)
    : null;
}

function resolveEventType(value?: string | null) {
  return value && Object.values(EventType).includes(value as EventType)
    ? (value as EventType)
    : null;
}

export function resolvePaymentFilter(value?: string | null): BookingPaymentFilter | null {
  switch (value) {
    case 'deposit-pending':
    case 'overdue':
    case 'due-soon':
      return value;
    default:
      return null;
  }
}

export function getPaymentFilterLabel(value: BookingPaymentFilter | null) {
  if (!value) return null;
  const match = ADMIN_BOOKING_PAYMENT_FILTER_OPTIONS.find((option) => option.id === value);
  return match?.label ?? null;
}

function cashMissingOrLessThan(field: BookingMoneyFieldRef): Prisma.BookingWhereInput[] {
  return [
    { cashAmount: null },
    { cashAmount: { lt: field } },
  ];
}

function depositOutstandingWhere(eventDate?: Prisma.DateTimeFilter): Prisma.BookingWhereInput {
  return {
    depositPaid: false,
    ...(eventDate ? { eventDate } : {}),
    OR: cashMissingOrLessThan(prisma.booking.fields.depositAmount),
  };
}

function remainingOutstandingWhere(eventDate?: Prisma.DateTimeFilter): Prisma.BookingWhereInput {
  return {
    remainingPaid: false,
    ...(eventDate ? { eventDate } : {}),
    OR: [
      { cashAmount: null },
      { depositPaid: true, cashAmount: { lt: prisma.booking.fields.remainingAmount } },
      { depositPaid: false, cashAmount: { lt: prisma.booking.fields.total } },
    ],
  };
}

export function buildBookingsWhere(params: BookingSearchParams, now = new Date()) {
  const status = resolveBookingStatus(params.status);
  const eventType = resolveEventType(params.eventType);
  const paymentFilter = resolvePaymentFilter(params.payment);
  const overdueEventDateLimit = addDays(now, ADMIN_BOOKING_DEPOSIT_DUE_DAYS);
  const overdueRemainingDateLimit = addDays(now, ADMIN_ECONOMY_PAYMENT_DUE_SOON_DAYS);
  const dueSoonDepositFrom = addDays(now, ADMIN_BOOKING_DEPOSIT_DUE_DAYS);
  const dueSoonDepositTo = addDays(now, ADMIN_BOOKING_DEPOSIT_DUE_DAYS + ADMIN_ECONOMY_PAYMENT_DUE_SOON_DAYS);
  const dueSoonRemainingFrom = addDays(now, ADMIN_ECONOMY_PAYMENT_DUE_SOON_DAYS);
  const dueSoonRemainingTo = addDays(now, ADMIN_ECONOMY_PAYMENT_DUE_SOON_DAYS * 2);

  const andClauses: Prisma.BookingWhereInput[] = [];
  if (status) {
    andClauses.push({ status });
  }
  if (eventType) {
    andClauses.push({ eventType });
  }
  if (params.fromDate || params.toDate) {
    const eventDate: Prisma.DateTimeFilter = {};
    if (params.fromDate) {
      eventDate.gte = new Date(params.fromDate);
    }
    if (params.toDate) {
      eventDate.lte = new Date(params.toDate + 'T23:59:59');
    }
    andClauses.push({ eventDate });
  }
  if (params.search) {
    const q = params.search;
    andClauses.push({
      OR: [
        { clientName: { contains: q, mode: 'insensitive' } },
        { reference: { contains: q, mode: 'insensitive' } },
        { eventLocation: { contains: q, mode: 'insensitive' } },
        { clientEmail: { contains: q, mode: 'insensitive' } },
      ],
    });
  }
  if (params.customerId) {
    andClauses.push({ customerId: params.customerId });
  }
  if (paymentFilter === 'deposit-pending') {
    andClauses.push(depositOutstandingWhere());
  }
  if (paymentFilter === 'overdue') {
    andClauses.push({
      OR: [
        depositOutstandingWhere({ lt: overdueEventDateLimit }),
        remainingOutstandingWhere({ lt: overdueRemainingDateLimit }),
      ],
    });
  }
  if (paymentFilter === 'due-soon') {
    andClauses.push({
      OR: [
        depositOutstandingWhere({
          gte: dueSoonDepositFrom,
          lte: dueSoonDepositTo,
        }),
        remainingOutstandingWhere({
          gte: dueSoonRemainingFrom,
          lte: dueSoonRemainingTo,
        }),
      ],
    });
  }

  return {
    paymentFilter,
    where: andClauses.length > 0 ? { AND: andClauses } : {},
  } satisfies { paymentFilter: BookingPaymentFilter | null; where: Prisma.BookingWhereInput };
}
