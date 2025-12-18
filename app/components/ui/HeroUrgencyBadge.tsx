'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

// ═══════════════════════════════════════════════════════════════
// HERO URGENCY BADGE - Badge dinàmic de disponibilitat
// Mostra dissabtes lliures d'octubre per Halloween
// ═══════════════════════════════════════════════════════════════

interface AvailabilityData {
  month: number;
  year: number;
  totalSaturdays: number;
  freeSaturdays: number;
  saturdays: Array<{
    date: string;
    available: boolean;
  }>;
}

export default function HeroUrgencyBadge() {
  const t = useTranslations('heroUrgency');
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<'halloween' | 'monMagic'>('halloween');

  // Fetch disponibilitat
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch('/api/public/availability');
        if (res.ok) {
          const json = await res.json();
          // Adaptar al format del API existent
          if (json.ok && json.data && json.data.monthlyAvailability && json.data.monthlyAvailability.length > 0) {
            const octoberData = json.data.monthlyAvailability.find(
              function(m: { month: string }) { return m.month && m.month.includes('-10'); }
            );
            const monthData = octoberData || json.data.monthlyAvailability[0];
            setAvailability({
              freeSaturdays: monthData.availableSaturdays || 3,
              totalSaturdays: monthData.totalSaturdays || 5,
              month: 10,
              year: 2025,
              saturdays: []
            });
          } else {
            setAvailability({ freeSaturdays: 3, totalSaturdays: 5, month: 10, year: 2025, saturdays: [] });
          }
        } else {
          setAvailability({ freeSaturdays: 3, totalSaturdays: 5, month: 10, year: 2025, saturdays: [] });
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        setAvailability({ freeSaturdays: 3, totalSaturdays: 5, month: 10, year: 2025, saturdays: [] });
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

  // Colors segons urgència
  const urgencyColors = {
    soldOut: 'from-gray-600 to-gray-800 text-gray-300',
    scarce: 'from-red-600 to-red-800 text-white animate-pulse',
    limited: 'from-orange-500 to-orange-700 text-white',
    available: 'from-emerald-500 to-emerald-700 text-white',
  };

  const themeColors = {
    halloween: 'from-orange-500 to-orange-700',
    monMagic: 'from-amber-500 to-amber-700',
  };

  if (loading) {
    return (
      <div className="h-8 w-48 bg-white/10 rounded-full animate-pulse" />
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
      {/* Badge Halloween amb disponibilitat dinàmica */}
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
            <span className="text-lg">🎃</span>
            <span>Halloween 2025:</span>
            {urgencyLevel === 'soldOut' ? (
              <span className="font-bold">{t('halloween.soldOut')}</span>
            ) : (
              <span className="font-bold">
                {availability?.freeSaturdays} dissabtes lliures oct.
              </span>
            )}
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
              bg-gradient-to-r ${themeColors.monMagic}
              text-sm font-medium text-white shadow-lg
            `}
          >
            <span className="text-lg">🪄</span>
            <span>Món Màgic:</span>
            <span className="font-bold">Disponible tot l'any</span>
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
        Reserva ara →
      </motion.a>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// VERSIÓ COMPACTA - Per a mobile o espais reduïts
// ═══════════════════════════════════════════════════════════════

export function HeroUrgencyBadgeCompact() {
  const [freeSaturdays, setFreeSaturdays] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch('/api/public/availability');
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data && json.data.monthlyAvailability && json.data.monthlyAvailability.length > 0) {
            const octoberData = json.data.monthlyAvailability.find(
              function(m: { month: string }) { return m.month && m.month.includes('-10'); }
            );
            const monthData = octoberData || json.data.monthlyAvailability[0];
            setFreeSaturdays(monthData.availableSaturdays || 3);
          } else {
            setFreeSaturdays(3);
          }
        } else {
          setFreeSaturdays(3);
        }
      } catch (error) {
        console.error('Error:', error);
        setFreeSaturdays(3);
      }
    }
    fetchAvailability();
  }, []);

  if (freeSaturdays === null) return null;

  const isUrgent = freeSaturdays <= 2;

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
      <span>🎃</span>
      <span>
        {freeSaturdays === 0 
          ? 'Halloween 2025 esgotat' 
          : `${freeSaturdays} dissabtes lliures oct.`
        }
      </span>
      {isUrgent && freeSaturdays > 0 && <span>⚠️</span>}
    </motion.div>
  );
}
