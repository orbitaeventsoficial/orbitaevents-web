'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════
// HERO URGENCY BADGE - Badge dinàmic de disponibilitat
// Mostra dissabtes lliures basats en dades reals de la BBDD
// ═══════════════════════════════════════════════════════════════

interface AvailabilityData {
  month: number;
  year: number;
  monthName: string;
  totalSaturdays: number;
  freeSaturdays: number;
  isHalloweenMonth: boolean;
}

// Noms dels mesos en català
const MONTH_NAMES_CA: Record<number, string> = {
  1: 'gen.', 2: 'feb.', 3: 'març', 4: 'abr.', 5: 'maig', 6: 'juny',
  7: 'jul.', 8: 'ago.', 9: 'set.', 10: 'oct.', 11: 'nov.', 12: 'des.'
};

export default function HeroUrgencyBadge() {
  const t = useTranslations('heroUrgency');
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<'halloween' | 'monMagic'>('halloween');

  // Fetch disponibilitat real de la BBDD
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch('/api/public/availability');
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.monthlyAvailability && json.data.monthlyAvailability.length > 0) {
            // Primer busquem octubre (mes de Halloween)
            const octoberData = json.data.monthlyAvailability.find(
              (m: { month: string }) => m.month && m.month.includes('-10')
            );

            // Si hi ha octubre, l'usem; si no, agafem el primer mes disponible
            const monthData = octoberData || json.data.monthlyAvailability[0];

            // Extreure mes i any del format "YYYY-MM"
            const [yearStr, monthStr] = monthData.month.split('-');
            const monthNum = parseInt(monthStr, 10);
            const yearNum = parseInt(yearStr, 10);

            setAvailability({
              freeSaturdays: monthData.availableSaturdays || 0,
              totalSaturdays: monthData.totalSaturdays || 0,
              month: monthNum,
              year: yearNum,
              monthName: MONTH_NAMES_CA[monthNum] || monthData.monthName,
              isHalloweenMonth: monthNum === 10
            });
          } else {
            // Fallback sense dades
            const now = new Date();
            setAvailability({
              freeSaturdays: 0,
              totalSaturdays: 0,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
              monthName: MONTH_NAMES_CA[now.getMonth() + 1],
              isHalloweenMonth: false
            });
          }
        } else {
          setAvailability(null);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailability(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, []);

  // Rotar entre Halloween i Món Màgic cada 5 segons
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTheme(prev => prev === 'halloween' ? 'monMagic' : 'halloween');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Determinar estat d'urgència
  const getUrgencyLevel = (free: number, total: number) => {
    const ratio = free / total;
    if (ratio === 0) return 'soldOut';
    if (ratio <= 0.2) return 'scarce';
    if (ratio <= 0.4) return 'limited';
    return 'available';
  };

  const urgencyLevel = availability 
    ? getUrgencyLevel(availability.freeSaturdays, availability.totalSaturdays)
    : 'available';

  // Colors segons urgència - estil elegant semi-transparent
  const urgencyColors = {
    soldOut: 'from-white/10 to-white/5 border border-gray-500/30 text-gray-300 backdrop-blur-sm',
    scarce: 'from-white/10 to-white/5 border border-red-500/30 text-red-200 backdrop-blur-sm animate-pulse',
    limited: 'from-white/10 to-white/5 border border-orange-500/30 text-orange-200 backdrop-blur-sm',
    available: 'from-white/10 to-white/5 border border-emerald-500/30 text-emerald-200 backdrop-blur-sm',
  };

  const themeColors = {
    halloween: 'from-white/10 to-white/5 border border-orange-500/30',
    monMagic: 'from-white/10 to-white/5 border border-amber-500/30',
  };

  if (loading) {
    return (
      <div className="h-8 w-48 bg-white/10 rounded-full animate-pulse" />
    );
  }

  // Generar text dinàmic basat en dades reals de la BBDD + traduccions
  const getAvailabilityText = () => {
    if (!availability) return t('nextDates.noData');
    if (availability.freeSaturdays === 0) return t('halloween.soldOut');

    // Usar traducció amb paràmetres
    if (availability.isHalloweenMonth) {
      return t('halloween.saturdaysFree', {
        count: availability.freeSaturdays,
        month: availability.monthName
      });
    }
    return t('nextDates.saturdaysFree', {
      count: availability.freeSaturdays,
      month: availability.monthName
    });
  };

  const getTitle = () => {
    if (!availability) return t('nextDates.noData');
    if (availability.isHalloweenMonth) {
      return t('halloween.title', { year: availability.year });
    }
    return t('nextDates.title', {
      month: availability.monthName,
      year: availability.year
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
      {/* Badge amb disponibilitat dinàmica de la BBDD */}
      <AnimatePresence mode="wait">
        {currentTheme === 'halloween' && (
          <motion.div
            key="halloween"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full
              bg-gradient-to-r ${urgencyColors[urgencyLevel]}
              text-sm font-medium shadow-lg
            `}
          >
            <span className="text-lg">{availability?.isHalloweenMonth ? '🎃' : '📅'}</span>
            <span>{getTitle()}</span>
            <span className="font-bold">{getAvailabilityText()}</span>
            {urgencyLevel === 'scarce' && (
              <span className="ml-1 text-yellow-300">⚠️</span>
            )}
          </motion.div>
        )}

        {currentTheme === 'monMagic' && (
          <motion.div
            key="monMagic"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full
              bg-gradient-to-r ${themeColors.monMagic} backdrop-blur-sm
              text-sm font-medium text-amber-200 shadow-lg
            `}
          >
            <span className="text-lg">🪄</span>
            <span>{t('monMagic.title')}</span>
            <span className="font-bold">{t('monMagic.available')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA petit */}
      <motion.a
        href="#contacte"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="
          inline-flex items-center gap-1 px-3 py-1.5 rounded-full
          bg-white/10 hover:bg-white/20 backdrop-blur-sm
          text-white/90 text-xs font-medium
          transition-colors cursor-pointer
        "
      >
        {t('cta.reserveNow')}
      </motion.a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VERSIÓ COMPACTA - Per a mobile o espais reduïts
// ═══════════════════════════════════════════════════════════════

interface CompactAvailability {
  freeSaturdays: number;
  monthName: string;
  year: number;
  isHalloweenMonth: boolean;
}

export function HeroUrgencyBadgeCompact() {
  const [availability, setAvailability] = useState<CompactAvailability | null>(null);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch('/api/public/availability');
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.monthlyAvailability && json.data.monthlyAvailability.length > 0) {
            const octoberData = json.data.monthlyAvailability.find(
              (m: { month: string }) => m.month && m.month.includes('-10')
            );
            const monthData = octoberData || json.data.monthlyAvailability[0];
            const [yearStr, monthStr] = monthData.month.split('-');
            const monthNum = parseInt(monthStr, 10);

            setAvailability({
              freeSaturdays: monthData.availableSaturdays || 0,
              monthName: MONTH_NAMES_CA[monthNum] || monthData.monthName,
              year: parseInt(yearStr, 10),
              isHalloweenMonth: monthNum === 10
            });
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    fetchAvailability();
  }, []);

  if (!availability) return null;

  const isUrgent = availability.freeSaturdays <= 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
        ${isUrgent
          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
        }
      `}
    >
      <span>{availability.isHalloweenMonth ? '🎃' : '📅'}</span>
      <span>
        {availability.freeSaturdays === 0
          ? `${availability.monthName} ${availability.year} esgotat`
          : `${availability.freeSaturdays} dissabtes lliures ${availability.monthName}`
        }
      </span>
      {isUrgent && availability.freeSaturdays > 0 && <span>⚠️</span>}
    </motion.div>
  );
}
