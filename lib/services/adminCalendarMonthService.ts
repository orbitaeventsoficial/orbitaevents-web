import { prisma } from '@/lib/prisma';

type CalendarDay = {
  reservas: {
    id: string;
    leadId: string | null;
    customerId: string | null;
    fechaEvento: string;
    clientName: string | null;
    ubicacion: string | null;
    estado: string | null;
    eventType: string | null;
    total: number | null;
    eventStartTime: string | null;
    eventEndTime: string | null;
    packName: string | null;
  }[];
  bloqueos: {
    id: string;
    fecha: string;
    motivo: string | null;
    notas: string | null;
  }[];
};

export async function getAdminCalendarMonth(from?: string | null, to?: string | null) {
  if (!from || !to) {
    return { status: 400, body: { error: 'Paràmetres from i to requerits' } };
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const bookings = await prisma.booking.findMany({
    where: {
      eventDate: {
        gte: fromDate,
        lte: toDate,
      },
      status: {
        notIn: ['CANCELLED'],
      },
    },
    select: {
      id: true,
      leadId: true,
      customerId: true,
      eventDate: true,
      clientName: true,
      eventLocation: true,
      eventVenue: true,
      status: true,
      eventType: true,
      total: true,
      eventStartTime: true,
      eventEndTime: true,
      pack: {
        select: {
          slug: true,
          translations: {
            where: { locale: { in: ['ca', 'es', 'en'] } },
            select: { locale: true, name: true },
          },
        },
      },
    },
    orderBy: {
      eventDate: 'asc',
    },
  });

  const availabilities = await prisma.availability.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate,
      },
      status: 'BLOCKED',
    },
    select: {
      id: true,
      date: true,
      note: true,
    },
  });

  const days: Record<string, CalendarDay> = {};
  const currentDate = new Date(fromDate);
  while (currentDate <= toDate) {
    const key = currentDate.toISOString().slice(0, 10);
    days[key] = { reservas: [], bloqueos: [] };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  for (const booking of bookings) {
    const key = booking.eventDate.toISOString().slice(0, 10);
    if (!days[key]) continue;

    days[key].reservas.push({
      id: booking.id,
      leadId: booking.leadId ?? null,
      customerId: booking.customerId ?? null,
      fechaEvento: booking.eventDate.toISOString(),
      clientName: booking.clientName,
      ubicacion: booking.eventVenue || booking.eventLocation,
      estado: booking.status,
      eventType: booking.eventType,
      total: booking.total,
      eventStartTime: booking.eventStartTime,
      eventEndTime: booking.eventEndTime,
      packName:
        booking.pack?.translations.find((translation) => translation.locale === 'ca')?.name ||
        booking.pack?.translations.find((translation) => translation.locale === 'es')?.name ||
        booking.pack?.translations.find((translation) => translation.locale === 'en')?.name ||
        booking.pack?.slug ||
        null,
    });
  }

  for (const availability of availabilities) {
    const key = availability.date.toISOString().slice(0, 10);
    if (!days[key]) continue;

    days[key].bloqueos.push({
      id: availability.id,
      fecha: availability.date.toISOString(),
      motivo: 'Dia bloquejat',
      notas: availability.note,
    });
  }

  return { status: 200, body: { days } };
}
