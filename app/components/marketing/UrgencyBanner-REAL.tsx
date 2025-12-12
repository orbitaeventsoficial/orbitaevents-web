'use client';

// ═══════════════════════════════════════════════════════════════════════════
// URGENCY BANNER REAL - DISPONIBILITAT 100% REAL DE BD
// ═══════════════════════════════════════════════════════════════════════════
// 
// Connectat a /api/public/availability
// - Mostra dissabtes disponibles REALS
// - Nivell d'urgència calculat
// - Missatge d'escassetat dinàmic
// - Zero fake scarcity
//
// Versió: 3.0 DEFINITIVA - Desembre 2025
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvailability, useCountdown } from '@/hooks/usePublicData';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function CalendarPreview() {
  const { data, isLoading } = useAvailability();
  
  if (isLoading) {
    return (
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-12 h-14 bg-white/10 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Get next 4 Saturdays from first month
  const firstMonth = data.monthlyAvailability[0];
  if (!firstMonth) return null;
  
  const saturdays = firstMonth.saturdayDates.slice(0, 4);

  return (
    <div className="flex gap-2">
      {saturdays.map((saturday, i) => {
        const date = new Date(saturday.date);
        const day = date.getDate();
        const month = date.toLocaleDateString('ca-ES', { month: 'short' });
        
        return (
          <div
            key={i}
            className={`relative flex flex-col items-center justify-center w-12 h-14 rounded-lg border transition-all ${
              saturday.status === 'available'
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : saturday.status === 'booked'
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-white/10 border-white/20 text-white/40'
            }`}
          >
            <span className="text-xs uppercase">{month}</span>
            <span className="text-lg font-bold">{day}</span>
            {saturday.status === 'booked' && (
              <span className="absolute -top-1 -right-1 text-xs">🔒</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CountdownDisplay() {
  const t = useTranslations('urgency');
  const { countdownTarget, data } = useAvailability();
  const { timeLeft, isExpired } = useCountdown(countdownTarget);

  if (isExpired || !countdownTarget) {
    return (
      <span className="text-amber-400 font-bold animate-pulse">
        ⚡ {t('consultNow')}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-white/70 text-sm">
        {t('nextSaturday')}
      </span>
      <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
        <span className="bg-black/40 px-2 py-1 rounded">{String(timeLeft.days).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-black/40 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-black/40 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="hidden md:inline">:</span>
        <span className="hidden md:inline bg-black/40 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function UrgencyBannerReal() {
  const t = useTranslations('urgency');
  const tCommon = useTranslations('common.buttons');
  const { data, isLoading, error } = useAvailability();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || error) return null;

  // Get urgency styling
  const urgencyStyles = {
    critical: {
      bg: 'from-red-900/80 to-red-800/80',
      border: 'border-red-500/50',
      text: 'text-red-400',
      pulse: true,
    },
    high: {
      bg: 'from-orange-900/80 to-amber-900/80',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      pulse: true,
    },
    medium: {
      bg: 'from-amber-900/80 to-yellow-900/80',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      pulse: false,
    },
    low: {
      bg: 'from-green-900/80 to-emerald-900/80',
      border: 'border-green-500/50',
      text: 'text-green-400',
      pulse: false,
    },
  };

  const style = urgencyStyles[data.urgencyLevel] || urgencyStyles.low;

  // Calculate available count
  const totalAvailable = data.monthlyAvailability.reduce(
    (acc, month) => acc + month.availableSaturdays,
    0
  );

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`py-6 bg-gradient-to-r ${style.bg} border-y ${style.border} ${style.pulse ? 'animate-pulse-slow' : ''}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Left side - Message */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Icon */}
              <div className={`text-3xl ${style.pulse ? 'animate-bounce' : ''}`}>
                {data.urgencyLevel === 'critical' ? '🔥' : 
                 data.urgencyLevel === 'high' ? '⚡' :
                 data.urgencyLevel === 'medium' ? '📅' : '✅'}
              </div>
              
              {/* Text */}
              <div className="text-center md:text-left">
                <h3 className={`text-lg font-bold ${style.text}`}>
                  {isLoading ? (
                    <span className="inline-block w-48 h-5 bg-white/20 rounded animate-pulse" />
                  ) : (
                    data.scarcityMessage || t('defaultMessage')
                  )}
                </h3>
                <p className="text-white/60 text-sm">
                  {isLoading ? (
                    <span className="inline-block w-32 h-4 bg-white/10 rounded animate-pulse" />
                  ) : (
                    <>
                      {totalAvailable} {t('saturdaysAvailable')} {t('nextMonths')}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Center - Calendar preview */}
            <div className="hidden lg:block">
              <CalendarPreview />
            </div>

            {/* Right side - Countdown & CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <CountdownDisplay />
              
              <Link
                href="/contacto"
                className={`px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all whitespace-nowrap flex items-center gap-2 ${style.pulse ? 'animate-pulse' : ''}`}
              >
                {t('cta')}
                <span>→</span>
              </Link>
            </div>

            {/* Close button */}
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 lg:relative lg:top-auto lg:right-auto text-white/40 hover:text-white/70 transition-colors p-1"
              aria-label={tCommon('close')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile calendar */}
          <div className="lg:hidden mt-4 flex justify-center">
            <CalendarPreview />
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
