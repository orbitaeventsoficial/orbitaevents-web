// app/api/admin/calendario/mes/route.ts
// API per obtenir dades del calendari amb reserves reals

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

type CalendarDay = {
  reservas: {
    id: string;
    leadId: string | null;
    fechaEvento: string;
    clienteNombre: string | null;
    ubicacion: string | null;
    estado: string | null;
    eventType: string | null;
    total: number | null;
  }[];
  bloqueos: {
    id: string;
    fecha: string;
    motivo: string | null;
    notas: string | null;
  }[];
};

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Paràmetres from i to requerits' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Obtenir reserves en el rang de dates
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
        eventDate: true,
        clientName: true,
        eventLocation: true,
        eventVenue: true,
        status: true,
        eventType: true,
        total: true,
        eventStartTime: true,
        eventEndTime: true,
      },
      orderBy: {
        eventDate: 'asc',
      },
    });

    // Obtenir disponibilitats (bloquejos)
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

    // Agrupar per dia
    const days: Record<string, CalendarDay> = {};

    // Inicialitzar tots els dies del rang
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const key = currentDate.toISOString().slice(0, 10);
      days[key] = { reservas: [], bloqueos: [] };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Afegir reserves
    for (const booking of bookings) {
      const key = booking.eventDate.toISOString().slice(0, 10);
      if (days[key]) {
        days[key].reservas.push({
          id: booking.id,
          leadId: booking.leadId ?? null,
          fechaEvento: booking.eventDate.toISOString(),
          clienteNombre: booking.clientName,
          ubicacion: booking.eventVenue || booking.eventLocation,
          estado: booking.status,
          eventType: booking.eventType,
          total: booking.total,
        });
      }
    }

    // Afegir bloquejos
    for (const availability of availabilities) {
      const key = availability.date.toISOString().slice(0, 10);
      if (days[key]) {
        days[key].bloqueos.push({
          id: availability.id,
          fecha: availability.date.toISOString(),
          motivo: 'Dia bloquejat',
          notas: availability.note,
        });
      }
    }

    return NextResponse.json({ days });
  } catch (error) {
    log.error('Error obtenint calendari:', error);
    return NextResponse.json(
      { error: 'Error obtenint dades del calendari' },
      { status: 500 }
    );
  }
}