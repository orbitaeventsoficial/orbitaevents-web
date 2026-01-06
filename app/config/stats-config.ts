// =============================================================================
// STATS CONFIG CORREGIT
// Substitueix app/config/stats-config.ts amb aquest contingut
// =============================================================================

export interface StatItem {
  id: string
  value: number
  suffix?: string
  prefix?: string
  label: string
  sublabel?: string
  icon?: string
  color?: string
  animate?: boolean
}

export const statsConfig: StatItem[] = [
  {
    id: 'years',
    value: 2023,
    prefix: 'Des de ',
    suffix: '',
    label: 'En el sector events',
    sublabel: 'Experiència real i passió',
    icon: '⭐',
    color: 'gold',
    animate: false
  },
  {
    id: 'events',
    value: 48, // Esdeveniments celebrats - Verifica amb BD real!
    suffix: '+',
    label: "Esdeveniments celebrats",
    sublabel: "Casaments, festes, corporatius",
    icon: '🎉',
    color: 'purple', // from-purple-600 to-purple-800
    animate: true
  },
  {
    id: 'response',
    value: 2,
    suffix: 'h',
    label: "Resposta",
    sublabel: "Temps màxim de resposta",
    icon: '⚡',
    color: 'green', // from-green-600 to-green-800
    animate: false
  },
  {
    id: 'provinces',
    value: 2, // ⚠️ CORREGIT: Era 1, ara és 2 (Barcelona + Girona)
    suffix: '',
    label: "Províncies",
    sublabel: "Barcelona i Girona", // ⚠️ CORREGIT: Nom complet
    icon: '📍',
    color: 'teal', // from-teal-600 to-teal-800
    animate: false
  }
]

// =============================================================================
// VERSIÓ EXTESA AMB MÉS DADES
// =============================================================================

export const statsConfigExtended: StatItem[] = [
  ...statsConfig,
  {
    id: 'rating',
    value: 5.0,
    suffix: '',
    prefix: '★',
    label: "Valoració Google",
    sublabel: "Opinions verificades",
    icon: '⭐',
    color: 'gold',
    animate: false
  },
  {
    id: 'cities',
    value: 25,
    suffix: '+',
    label: "Ciutats",
    sublabel: "On hem treballat",
    icon: '🏙️',
    color: 'blue',
    animate: true
  },
  {
    id: 'satisfaction',
    value: 100,
    suffix: '%',
    label: "Satisfacció",
    sublabel: "Garantia de qualitat",
    icon: '✅',
    color: 'green',
    animate: true
  }
]

// =============================================================================
// COLORS MAP PER A TAILWIND
// =============================================================================

export const statColors: Record<string, { bg: string; text: string; border: string }> = {
  gold: {
    bg: 'from-amber-900/60 to-amber-950/80',
    text: 'text-amber-400',
    border: 'border-amber-500/30'
  },
  purple: {
    bg: 'from-purple-900/60 to-purple-950/80',
    text: 'text-purple-400',
    border: 'border-purple-500/30'
  },
  green: {
    bg: 'from-green-900/60 to-green-950/80',
    text: 'text-green-400',
    border: 'border-green-500/30'
  },
  teal: {
    bg: 'from-teal-900/60 to-teal-950/80',
    text: 'text-teal-400',
    border: 'border-teal-500/30'
  },
  blue: {
    bg: 'from-blue-900/60 to-blue-950/80',
    text: 'text-blue-400',
    border: 'border-blue-500/30'
  },
  red: {
    bg: 'from-red-900/60 to-red-950/80',
    text: 'text-red-400',
    border: 'border-red-500/30'
  }
}

// =============================================================================
// HELPER: Obtenir stats des de BD (per implementar)
// =============================================================================

export async function getStatsFromDatabase() {
  try {
    // Intentar obtenir stats de la BD si Prisma està disponible
    const { prisma } = await import('@/lib/prisma');
    if (!prisma) throw new Error('Prisma not available');

    const [eventsCompleted, avgRatingResult] = await Promise.all([
      prisma.booking.count({ where: { status: 'COMPLETED' } }).catch(() => 48),
      prisma.customerTestimonial.aggregate({
        _avg: { rating: true },
        where: { isApproved: true }
      }).catch(() => ({ _avg: { rating: 5.0 } })),
    ]);

    return {
      eventsCompleted: eventsCompleted || 48,
      avgRating: avgRatingResult._avg?.rating || 5.0,
      yearsActive: Math.floor((Date.now() - new Date('2023-01-01').getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      provinces: 2,
      cities: 25
    };
  } catch {
    // Fallback a valors estàtics
    return {
      eventsCompleted: 48,
      avgRating: 5.0,
      yearsActive: Math.floor((Date.now() - new Date('2023-01-01').getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      provinces: 2,
      cities: 25
    };
  }
}

// =============================================================================
// COMPONENT D'EXEMPLE D'ÚS
// =============================================================================

/*
import { statsConfig, statColors } from '@/config/stats-config'

export function StatsSection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statsConfig.map((stat) => {
        const colors = statColors[stat.color || 'gold']
        return (
          <div
            key={stat.id}
            className={`
              rounded-xl p-6
              bg-gradient-to-br ${colors.bg}
              border ${colors.border}
            `}
          >
            <span className="text-2xl">{stat.icon}</span>
            <div className={`text-4xl font-bold font-mono ${colors.text}`}>
              {stat.prefix}{stat.value}{stat.suffix}
            </div>
            <div className="text-white/90 font-medium">{stat.label}</div>
            {stat.sublabel && (
              <div className="text-white/50 text-sm">{stat.sublabel}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
*/
