import { BookingStatus, EventType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function listAdminBookings(input: {
  locale: string;
  status?: string | null;
  eventType?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
  page: number;
  limit: number;
}) {
  const validStatus = input.status && Object.values(BookingStatus).includes(input.status as BookingStatus)
    ? (input.status as BookingStatus)
    : undefined;
  const validEventType = input.eventType && Object.values(EventType).includes(input.eventType as EventType)
    ? (input.eventType as EventType)
    : undefined;

  const where = {
    ...(validStatus && { status: validStatus }),
    ...(validEventType && { eventType: validEventType }),
    ...((input.fromDate || input.toDate) && {
      eventDate: {
        ...(input.fromDate && { gte: new Date(input.fromDate) }),
        ...(input.toDate && { lte: new Date(`${input.toDate}T23:59:59`) }),
      },
    }),
    ...(input.search && {
      OR: [
        { clientName: { contains: input.search, mode: 'insensitive' as const } },
        { clientEmail: { contains: input.search, mode: 'insensitive' as const } },
        { reference: { contains: input.search, mode: 'insensitive' as const } },
      ],
    }),
  };

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
