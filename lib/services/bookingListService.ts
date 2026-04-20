import { BookingStatus, EventType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type BookingPaymentFilter = 'deposit-pending' | 'overdue' | 'due-soon';

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function resolvePaymentFilter(value?: string | null): BookingPaymentFilter | null {
  switch (value) {
    case 'deposit-pending':
    case 'overdue':
    case 'due-soon':
      return value;
    default:
      return null;
  }
}

export async function listAdminBookings(input: {
  locale: string;
  status?: string | null;
  eventType?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
  payment?: string | null;
  page: number;
  limit: number;
}, now: Date = new Date()) {
  const validStatus = input.status && Object.values(BookingStatus).includes(input.status as BookingStatus)
    ? (input.status as BookingStatus)
    : undefined;
  const validEventType = input.eventType && Object.values(EventType).includes(input.eventType as EventType)
    ? (input.eventType as EventType)
    : undefined;
  const paymentFilter = resolvePaymentFilter(input.payment);
  const overdueEventDateLimit = addDays(now, 30);
  const overdueRemainingDateLimit = addDays(now, 7);
  const dueSoonDepositFrom = addDays(now, 30);
  const dueSoonDepositTo = addDays(now, 37);
  const dueSoonRemainingFrom = addDays(now, 7);
  const dueSoonRemainingTo = addDays(now, 14);

  const andClauses: Prisma.BookingWhereInput[] = [];
  if (validStatus) {
    andClauses.push({ status: validStatus });
  }
  if (validEventType) {
    andClauses.push({ eventType: validEventType });
  }
  if (input.fromDate || input.toDate) {
    const eventDate: Prisma.DateTimeFilter = {};
    if (input.fromDate) {
      eventDate.gte = new Date(input.fromDate);
    }
    if (input.toDate) {
      eventDate.lte = new Date(`${input.toDate}T23:59:59`);
    }
    andClauses.push({ eventDate });
  }
  if (input.search) {
    andClauses.push({
      OR: [
        { clientName: { contains: input.search, mode: 'insensitive' } },
        { clientEmail: { contains: input.search, mode: 'insensitive' } },
        { reference: { contains: input.search, mode: 'insensitive' } },
        { eventLocation: { contains: input.search, mode: 'insensitive' } },
      ],
    });
  }
  if (paymentFilter === 'deposit-pending') {
    andClauses.push({ depositPaid: false });
  }
  if (paymentFilter === 'overdue') {
    andClauses.push({
      OR: [
        { depositPaid: false, eventDate: { lt: overdueEventDateLimit } },
        { remainingPaid: false, eventDate: { lt: overdueRemainingDateLimit } },
      ],
    });
  }
  if (paymentFilter === 'due-soon') {
    andClauses.push({
      OR: [
        {
          depositPaid: false,
          eventDate: {
            gte: dueSoonDepositFrom,
            lte: dueSoonDepositTo,
          },
        },
        {
          remainingPaid: false,
          eventDate: {
            gte: dueSoonRemainingFrom,
            lte: dueSoonRemainingTo,
          },
        },
      ],
    });
  }

  const where: Prisma.BookingWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

  const [bookings, total, stats] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        pack: { include: { translations: { where: { locale: input.locale } } } },
        extras: { include: { extra: { include: { translations: { where: { locale: input.locale } } } } } },
        lead: { select: { id: true, name: true, source: true, preferredLocale: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { eventDate: 'asc' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.booking.count({ where }),
    prisma.booking.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: { total: true },
    }),
  ]);

  return {
    ok: true,
    bookings,
    total,
    page: input.page,
    totalPages: Math.ceil(total / input.limit),
    stats: stats.reduce((acc, stat) => {
      acc[stat.status] = { count: stat._count, revenue: stat._sum.total || 0 };
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>),
  };
}
