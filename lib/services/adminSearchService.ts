import { prisma } from '@/lib/prisma';

const MAX_RESULTS = 5;

export async function searchAdminEntities(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return {
      ok: true,
      leads: [],
      bookings: [],
      customers: [],
    };
  }

  const [leads, bookings, customers] = await Promise.all([
    prisma.lead.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { email: { contains: trimmed, mode: 'insensitive' } },
          { phone: { contains: trimmed } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_RESULTS,
    }),
    prisma.booking.findMany({
      where: {
        OR: [
          { reference: { contains: trimmed, mode: 'insensitive' } },
          { clientName: { contains: trimmed, mode: 'insensitive' } },
          { clientEmail: { contains: trimmed, mode: 'insensitive' } },
          { clientPhone: { contains: trimmed } },
        ],
      },
      select: {
        id: true,
        reference: true,
        clientName: true,
        clientEmail: true,
        status: true,
        eventDate: true,
      },
      orderBy: { eventDate: 'desc' },
      take: MAX_RESULTS,
    }),
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { email: { contains: trimmed, mode: 'insensitive' } },
          { phone: { contains: trimmed } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalEvents: true,
        lastEventDate: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: MAX_RESULTS,
    }),
  ]);

  return {
    ok: true,
    leads,
    bookings,
    customers,
  };
}
