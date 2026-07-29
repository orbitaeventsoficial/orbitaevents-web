import { prisma } from '@/lib/prisma';
import { buildBookingsWhere } from '@/lib/services/bookingPaymentFilter';

export async function listAdminBookings(input: {
  locale: string;
  status?: string | null;
  eventType?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
  payment?: string | null;
  customerId?: string | null;
  page: number;
  limit: number;
}, now: Date = new Date()) {
  const { where } = buildBookingsWhere({
    status: input.status,
    eventType: input.eventType,
    fromDate: input.fromDate,
    toDate: input.toDate,
    search: input.search,
    payment: input.payment,
    customerId: input.customerId,
  }, now);

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
