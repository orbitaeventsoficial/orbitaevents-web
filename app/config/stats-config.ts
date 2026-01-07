import { SITE_CONFIG } from '@/config/site-config';

export interface StatItem {
  id: string;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  sublabel?: string;
  icon?: string;
  color?: string;
  animate?: boolean;
}

export const statsConfig: StatItem[] = [
  {
    id: 'years',
    value: SITE_CONFIG.stats.yearsExperience,
    prefix: 'Desde ',
    suffix: '',
    label: 'En el sector eventos',
    sublabel: 'Experiencia real y pasion',
    icon: '*',
    color: 'gold',
    animate: false,
  },
  {
    id: 'events',
    value: SITE_CONFIG.stats.eventsCompleted,
    suffix: '+',
    label: 'Eventos realizados',
    sublabel: 'Bodas, fiestas y corporativos',
    icon: '*',
    color: 'purple',
    animate: true,
  },
  {
    id: 'response',
    value: 2,
    suffix: 'h',
    label: 'Respuesta',
    sublabel: 'Tiempo maximo de respuesta',
    icon: '*',
    color: 'green',
    animate: false,
  },
  {
    id: 'provinces',
    value: SITE_CONFIG.stats.citiesCovered,
    suffix: '',
    label: 'Provincias',
    sublabel: 'Barcelona y Girona',
    icon: '*',
    color: 'teal',
    animate: false,
  },
];

export const statsConfigExtended: StatItem[] = [
  ...statsConfig,
  {
    id: 'rating',
    value: SITE_CONFIG.stats.avgRating,
    suffix: '',
    prefix: '',
    label: 'Valoracion Google',
    sublabel: 'Opiniones verificadas',
    icon: '*',
    color: 'gold',
    animate: false,
  },
  {
    id: 'cities',
    value: 25,
    suffix: '+',
    label: 'Ciudades',
    sublabel: 'Donde hemos trabajado',
    icon: '*',
    color: 'blue',
    animate: true,
  },
  {
    id: 'satisfaction',
    value: SITE_CONFIG.stats.recommendRate,
    suffix: '%',
    label: 'Satisfaccion',
    sublabel: 'Garantia de calidad',
    icon: '*',
    color: 'green',
    animate: true,
  },
];

export const statColors: Record<string, { bg: string; text: string; border: string }> = {
  gold: {
    bg: 'from-amber-900/60 to-amber-950/80',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  purple: {
    bg: 'from-purple-900/60 to-purple-950/80',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  green: {
    bg: 'from-green-900/60 to-green-950/80',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
  teal: {
    bg: 'from-teal-900/60 to-teal-950/80',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
  },
  blue: {
    bg: 'from-blue-900/60 to-blue-950/80',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  red: {
    bg: 'from-red-900/60 to-red-950/80',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
};

export async function getStatsFromDatabase() {
  try {
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error('Prisma not available');

    const [eventsCompleted, avgRatingResult] = await Promise.all([
      prisma.booking.count({ where: { status: 'COMPLETED' } }).catch(() => SITE_CONFIG.stats.eventsCompleted),
      prisma.customerTestimonial.aggregate({
        _avg: { rating: true },
        where: { isApproved: true },
      }).catch(() => ({ _avg: { rating: SITE_CONFIG.stats.avgRating } })),
    ]);

    return {
      eventsCompleted: eventsCompleted || SITE_CONFIG.stats.eventsCompleted,
      avgRating: avgRatingResult._avg?.rating || SITE_CONFIG.stats.avgRating,
      yearsActive: SITE_CONFIG.stats.yearsExperience,
      provinces: SITE_CONFIG.stats.citiesCovered,
      cities: 25,
    };
  } catch {
    return {
      eventsCompleted: SITE_CONFIG.stats.eventsCompleted,
      avgRating: SITE_CONFIG.stats.avgRating,
      yearsActive: SITE_CONFIG.stats.yearsExperience,
      provinces: SITE_CONFIG.stats.citiesCovered,
      cities: 25,
    };
  }
}