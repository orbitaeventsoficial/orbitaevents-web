// app/api/public/availability/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// API PÚBLICA DE DISPONIBILIDAD
// ═══════════════════════════════════════════════════════════════════════════
//
// Esta API devuelve información de disponibilidad para el frontend:
// - Próxima fecha disponible
// - Sábados disponibles por mes
// - Fechas ocupadas
//
// NO requiere autenticación - es pública pero con cache
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache: revalidar cada 5 minutos
export const revalidate = 300;

// Tipos
interface AvailabilityResponse {
  ok: boolean;
  data: {
    nextAvailableDate: string | null;
    nextAvailableSaturday: string | null;
    monthlyAvailability: {
      month: string;
      monthName: string;
      year: number;
      totalSaturdays: number;
      availableSaturdays: number;
      bookedSaturdays: number;
      blockedSaturdays: number;
      saturdayDates: {
        date: string;
        status: 'available' | 'booked' | 'blocked';
      }[];
    }[];
    scarcityMessage: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  generatedAt: string;
}

// Helper: Obtener todos los sábados de un mes
function getSaturdaysOfMonth(year: number, month: number): Date[] {
  const saturdays: Date[] = [];
  const date = new Date(year, month, 1);

  // Encontrar el primer sábado
  while (date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }

  // Añadir todos los sábados del mes
  while (date.getMonth() === month) {
    saturdays.push(new Date(date));
    date.setDate(date.getDate() + 7);
  }

  return saturdays;
}

// Helper: Formatear fecha para comparación
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Helper: Nombre del mes en español
function getMonthName(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month];
}

// Helper to generate fallback availability
function generateFallbackAvailability() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Generate next available Saturday
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));

  return {
    ok: true,
    data: {
      nextAvailableDate: nextSaturday.toISOString().slice(0, 10),
      nextAvailableSaturday: nextSaturday.toISOString().slice(0, 10),
      monthlyAvailability: [{
        month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
        monthName: getMonthName(currentMonth),
        year: currentYear,
        totalSaturdays: 4,
        availableSaturdays: 2,
        bookedSaturdays: 2,
        blockedSaturdays: 0,
        saturdayDates: [],
      }],
      scarcityMessage: `${getMonthName(currentMonth)}: quedan 2 sábados`,
      urgencyLevel: 'medium' as const,
    },
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}

export async function GET() {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(generateFallbackAvailability(), {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  }

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Obtener próximos 4 meses
    const monthsToCheck = 4;
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + monthsToCheck, 0);

    // Obtener todas las reservas confirmadas en el rango
    const bookings = await prisma.booking.findMany({
      where: {
        eventDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING'],
        },
      },
      select: {
        eventDate: true,
      },
    });

    // Obtener bloqueos
    const blockedDates = await prisma.availability.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'BLOCKED',
      },
      select: {
        date: true,
      },
    });

    // Crear sets para búsqueda rápida
    const bookedDatesSet = new Set(
      bookings.map(b => formatDate(b.eventDate))
    );
    const blockedDatesSet = new Set(
      blockedDates.map(b => formatDate(b.date))
    );

    // Procesar cada mes
    const monthlyAvailability = [];
    let nextAvailableSaturday: string | null = null;
    let totalAvailableSaturdays = 0;

    for (let i = 0; i < monthsToCheck; i++) {
      const checkMonth = currentMonth + i;
      const checkYear = currentYear + Math.floor(checkMonth / 12);
      const normalizedMonth = checkMonth % 12;

      const saturdays = getSaturdaysOfMonth(checkYear, normalizedMonth);

      // Filtrar sábados pasados si es el mes actual
      const futureSaturdays = saturdays.filter(sat => sat > now);

      const saturdayDates = futureSaturdays.map(sat => {
        const dateStr = formatDate(sat);
        let status: 'available' | 'booked' | 'blocked' = 'available';

        if (bookedDatesSet.has(dateStr)) {
          status = 'booked';
        } else if (blockedDatesSet.has(dateStr)) {
          status = 'blocked';
        } else {
          totalAvailableSaturdays++;
          // Guardar el primer sábado disponible
          if (!nextAvailableSaturday) {
            nextAvailableSaturday = dateStr;
          }
        }

        return { date: dateStr, status };
      });

      const availableSaturdays = saturdayDates.filter(s => s.status === 'available').length;
      const bookedSaturdays = saturdayDates.filter(s => s.status === 'booked').length;
      const blockedSaturdays = saturdayDates.filter(s => s.status === 'blocked').length;

      monthlyAvailability.push({
        month: `${checkYear}-${String(normalizedMonth + 1).padStart(2, '0')}`,
        monthName: getMonthName(normalizedMonth),
        year: checkYear,
        totalSaturdays: futureSaturdays.length,
        availableSaturdays,
        bookedSaturdays,
        blockedSaturdays,
        saturdayDates,
      });
    }

    // Calcular nivel de urgencia
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const firstMonthAvailable = monthlyAvailability[0]?.availableSaturdays || 0;

    if (firstMonthAvailable === 0) {
      urgencyLevel = 'critical';
    } else if (firstMonthAvailable === 1) {
      urgencyLevel = 'high';
    } else if (firstMonthAvailable <= 2) {
      urgencyLevel = 'medium';
    }

    // Generar mensaje de escasez
    let scarcityMessage = '';
    const currentMonthName = getMonthName(currentMonth);

    if (urgencyLevel === 'critical') {
      scarcityMessage = `${currentMonthName}: ¡COMPLETO!`;
    } else if (urgencyLevel === 'high') {
      scarcityMessage = `${currentMonthName}: ¡Última fecha!`;
    } else if (urgencyLevel === 'medium') {
      scarcityMessage = `${currentMonthName}: quedan ${firstMonthAvailable} sábados`;
    } else {
      scarcityMessage = `${currentMonthName}: ${firstMonthAvailable} sábados disponibles`;
    }

    // Próxima fecha disponible (cualquier día, no solo sábados)
    let nextAvailableDate: string | null = null;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (let d = new Date(tomorrow); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      if (!bookedDatesSet.has(dateStr) && !blockedDatesSet.has(dateStr)) {
        nextAvailableDate = dateStr;
        break;
      }
    }

    const response: AvailabilityResponse = {
      ok: true,
      data: {
        nextAvailableDate,
        nextAvailableSaturday,
        monthlyAvailability,
        scarcityMessage,
        urgencyLevel,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);

    // En caso de error, devolver datos fallback - return 200
    return NextResponse.json(generateFallbackAvailability(), {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  }
}
