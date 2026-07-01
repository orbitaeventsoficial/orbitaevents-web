import { ADMIN_STATS_DEFINITIONS } from '@/lib/constants/admin';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

type AdminStatKey = typeof ADMIN_STATS_DEFINITIONS[number]['key'];

function getStatDefinition(key: string) {
  return ADMIN_STATS_DEFINITIONS.find((stat) => stat.key === key);
}

function parseStatFallback(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function calculateStats() {
  try {
    const eventsCount = await prisma.booking.count({
      where: { status: 'COMPLETED' },
    });

    const peopleResult = await prisma.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { guestCount: true },
    });
    const peopleCount = peopleResult._sum.guestCount || 0;

    const firstBooking = await prisma.booking.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { eventDate: 'asc' },
    });
    const yearsExperience = firstBooking
      ? new Date().getFullYear() - new Date(firstBooking.eventDate).getFullYear()
      : 0;

    const totalSurveys = await prisma.clientSurvey.count();
    const satisfiedSurveys = await prisma.clientSurvey.count({
      where: { npsScore: { gte: 8 } },
    });
    const satisfactionPercent = totalSurveys > 0
      ? Math.round((satisfiedSurveys / totalSurveys) * 100)
      : 95;

    const avgRating = await prisma.clientSurvey.aggregate({
      _avg: { overallRating: true },
    });
    const ratingAverage = avgRating._avg.overallRating
      ? Math.round(avgRating._avg.overallRating * 10) / 10
      : 5.0;

    return {
      'stats.events_completed': eventsCount,
      'stats.people_entertained': peopleCount,
      'stats.years_experience': yearsExperience,
      'stats.satisfaction_percent': satisfactionPercent,
      'stats.rating_average': ratingAverage,
    } satisfies Record<AdminStatKey, number>;
  } catch (error) {
    log.error('Error calculando estadísticas:', error);
    return {
      'stats.events_completed': 0,
      'stats.people_entertained': 0,
      'stats.years_experience': 0,
      'stats.satisfaction_percent': 0,
      'stats.rating_average': 0,
    } satisfies Record<AdminStatKey, number>;
  }
}

export async function listAdminStats() {
  const calculatedStats = await calculateStats();

  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ADMIN_STATS_DEFINITIONS.map((stat) => stat.key),
      },
    },
  });

  const settingsMap = new Map(settings.map((setting) => [setting.key, parseStatFallback(setting.value)]));

  return ADMIN_STATS_DEFINITIONS.map((stat) => {
    const calculated = calculatedStats[stat.key];
    const fallback = settingsMap.get(stat.key) || 0;
    const isManual = fallback > 0;
    const value = isManual ? fallback : calculated;

    return {
      ...stat,
      value,
      fallback,
      calculated,
      isManual,
    };
  });
}

export async function updateAdminStatFallback(input: {
  key: string;
  fallback?: number;
  resetToCalculated?: boolean;
}) {
  const definition = getStatDefinition(input.key);
  if (!definition) {
    throw new Error('Estadística no vàlida');
  }

  if (input.resetToCalculated) {
    await prisma.setting.deleteMany({ where: { key: input.key } });
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'stat',
        entityId: input.key,
        details: { action: 'reset_to_calculated' },
      },
    });
    return { ok: true as const, message: 'Estadística reseteada al valor calculado' };
  }

  if (typeof input.fallback !== 'number' || !Number.isFinite(input.fallback) || input.fallback < 0) {
    throw new Error('El fallback ha de ser un número positiu');
  }

  await prisma.setting.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      value: String(input.fallback),
      type: 'NUMBER',
      category: 'stats',
      label: definition.label,
      description: definition.description,
    },
    update: {
      value: String(input.fallback),
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'stat',
      entityId: input.key,
      details: { fallback: input.fallback },
    },
  });

  return { ok: true as const, message: 'Estadística actualizada correctamente' };
}

export function isAdminStatKey(key: string): key is AdminStatKey {
  return ADMIN_STATS_DEFINITIONS.some((stat) => stat.key === key);
}
