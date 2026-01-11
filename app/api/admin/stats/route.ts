// app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Definición de estadísticas disponibles
const STATS_DEFINITION = [
  {
    key: 'stats.events_completed',
    label: 'Eventos Realizados',
    description: 'Total de eventos completados con éxito',
    icon: '🎉',
  },
  {
    key: 'stats.people_entertained',
    label: 'Personas Entretenidas',
    description: 'Total de invitados en todos los eventos',
    icon: '👥',
  },
  {
    key: 'stats.years_experience',
    label: 'Años de Experiencia',
    description: 'Años desde el primer evento (calculado automáticamente)',
    icon: '📅',
  },
  {
    key: 'stats.satisfaction_percent',
    label: 'Satisfacción (%)',
    description: 'Porcentaje de clientes satisfechos',
    icon: '⭐',
  },
  {
    key: 'stats.rating_average',
    label: 'Rating Promedio',
    description: 'Valoración media de 1-5 estrellas',
    icon: '🌟',
  },
];

// Calcular estadísticas desde la BD
async function calculateStats() {
  try {
    // Eventos completados
    const eventsCount = await prisma.booking.count({
      where: { status: 'COMPLETED' },
    });

    // Personas entretenidas (suma de guestCount de bookings completados)
    const peopleResult = await prisma.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { guestCount: true },
    });
    const peopleCount = peopleResult._sum.guestCount || 0;

    // Años de experiencia (basado en el primer evento)
    const firstBooking = await prisma.booking.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { eventDate: 'asc' },
    });
    const yearsExperience = firstBooking
      ? new Date().getFullYear() - new Date(firstBooking.eventDate).getFullYear()
      : 0;

    // Satisfacción % (basado en surveys con NPS >= 8)
    const totalSurveys = await prisma.clientSurvey.count();
    const satisfiedSurveys = await prisma.clientSurvey.count({
      where: { npsScore: { gte: 8 } },
    });
    const satisfactionPercent = totalSurveys > 0
      ? Math.round((satisfiedSurveys / totalSurveys) * 100)
      : 95; // Default 95%

    // Rating promedio (basado en surveys)
    const avgRating = await prisma.clientSurvey.aggregate({
      _avg: { overallRating: true },
    });
    const ratingAverage = avgRating._avg.overallRating
      ? Math.round(avgRating._avg.overallRating * 10) / 10
      : 4.8; // Default 4.8

    return {
      'stats.events_completed': eventsCount,
      'stats.people_entertained': peopleCount,
      'stats.years_experience': yearsExperience,
      'stats.satisfaction_percent': satisfactionPercent,
      'stats.rating_average': ratingAverage,
    };
  } catch (error) {
    log.error('Error calculando estadísticas:', error);
    return {};
  }
}

// GET - Obtener todas las estadísticas
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    // Calcular valores desde la BD
    const calculatedStats = await calculateStats();

    // Obtener fallbacks de la BD
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: STATS_DEFINITION.map((s) => s.key),
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, parseFloat(s.value) || 0]));

    // Construir lista de stats
    const stats = STATS_DEFINITION.map((stat) => {
      const calculated = (calculatedStats as Record<string, number>)[stat.key] || 0;
      const fallback = settingsMap.get(stat.key) || 0;
      const isManual = fallback > 0;
      const value = isManual ? fallback : calculated;

      return {
        key: stat.key,
        label: stat.label,
        description: stat.description,
        icon: stat.icon,
        value,
        fallback,
        calculated,
        isManual,
      };
    });

    return NextResponse.json({
      ok: true,
      stats,
    });
  } catch (error) {
    log.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { ok: false, error: 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}

// POST - Actualizar fallback de una estadística
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { key, fallback, resetToCalculated } = body;

    if (!key) {
      return NextResponse.json(
        { ok: false, error: 'Key es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la stat existe
    const statExists = STATS_DEFINITION.some((s) => s.key === key);
    if (!statExists) {
      return NextResponse.json(
        { ok: false, error: 'Estadística no válida' },
        { status: 400 }
      );
    }

    // Si resetToCalculated, eliminar el setting para usar valor automático
    if (resetToCalculated) {
      await prisma.setting.deleteMany({
        where: { key },
      });

      await prisma.adminLog.create({
        data: {
          action: 'UPDATE',
          entity: 'stat',
          entityId: key,
          details: { action: 'reset_to_calculated' },
        },
      });

      return NextResponse.json({
        ok: true,
        message: 'Estadística reseteada al valor calculado',
      });
    }

    // Validar fallback
    if (typeof fallback !== 'number' || fallback < 0) {
      return NextResponse.json(
        { ok: false, error: 'Fallback debe ser un número positivo' },
        { status: 400 }
      );
    }

    // Actualizar o crear el setting
    await prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: fallback.toString(),
        type: 'NUMBER',
        category: 'stats',
        label: STATS_DEFINITION.find((s) => s.key === key)?.label,
        description: STATS_DEFINITION.find((s) => s.key === key)?.description,
      },
      update: {
        value: fallback.toString(),
      },
    });

    // Log del cambio
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'stat',
        entityId: key,
        details: { fallback },
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Estadística actualizada correctamente',
    });
  } catch (error) {
    log.error('Error actualizando estadística:', error);
    return NextResponse.json(
      { ok: false, error: 'Error actualizando estadística' },
      { status: 500 }
    );
  }
}
