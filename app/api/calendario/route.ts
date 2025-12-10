// app/api/calendario/route.ts
// API PÚBLICA de disponibilitat - Per components del frontend
// Retorna dies del mes amb disponibilitat real des de BD

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache de 5 minuts - No cal actualitzar més sovint
export const revalidate = 300;

interface DiaCalendari {
  fecha: string;
  disponible: boolean;
  ocupado: boolean;
  bloqueado: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mes } = body; // Format: "2025-01"

    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      return NextResponse.json(
        { error: 'Paràmetre mes requerit (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    const [year, month] = mes.split('-').map(Number);

    // Primer i últim dia del mes
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0); // Últim dia del mes

    // Obtenir reserves del mes (confirmades o en preparació)
    const bookings = await prisma.booking.findMany({
      where: {
        eventDate: {
          gte: firstDay,
          lte: lastDay,
        },
        status: {
          in: ['CONFIRMED', 'PREPARING', 'PENDING'],
        },
      },
      select: {
        eventDate: true,
      },
    });

    // Obtenir dies bloquejats
    const blockedDays = await prisma.availability.findMany({
      where: {
        date: {
          gte: firstDay,
          lte: lastDay,
        },
        status: 'BLOCKED',
      },
      select: {
        date: true,
      },
    });

    // Crear set de dates ocupades i bloquejades
    const occupiedDates = new Set(
      bookings.map(b => b.eventDate.toISOString().slice(0, 10))
    );
    const blockedDates = new Set(
      blockedDays.map(b => b.date.toISOString().slice(0, 10))
    );

    // Generar tots els dies del mes
    const dias: DiaCalendari[] = [];
    const currentDate = new Date(firstDay);

    while (currentDate <= lastDay) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const isOccupied = occupiedDates.has(dateStr);
      const isBlocked = blockedDates.has(dateStr);

      dias.push({
        fecha: dateStr,
        disponible: !isOccupied && !isBlocked,
        ocupado: isOccupied,
        bloqueado: isBlocked,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calcular estadístiques ràpides
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sabadosDisponibles = dias.filter(d => {
      const fecha = new Date(d.fecha);
      return fecha.getDay() === 6 && d.disponible && fecha >= today;
    }).length;

    const viernesDisponibles = dias.filter(d => {
      const fecha = new Date(d.fecha);
      return fecha.getDay() === 5 && d.disponible && fecha >= today;
    }).length;

    return NextResponse.json({
      dias,
      stats: {
        sabadosDisponibles,
        viernesDisponibles,
        totalDisponibles: dias.filter(d => d.disponible).length,
        totalOcupados: dias.filter(d => d.ocupado).length,
        totalBloqueados: dias.filter(d => d.bloqueado).length,
      },
      mes,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error obtenint calendari públic:', error);
    return NextResponse.json(
      { error: 'Error obtenint disponibilitat' },
      { status: 500 }
    );
  }
}

// També acceptem GET per compatibilitat
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes');

  if (!mes) {
    // Si no s'especifica mes, retornar el mes actual
    const now = new Date();
    const currentMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Crear una request simulada amb POST
    const fakeRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ mes: currentMes }),
      headers: { 'Content-Type': 'application/json' },
    });

    return POST(fakeRequest);
  }

  // Si hi ha mes, processar com POST
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ mes }),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(fakeRequest);
}
