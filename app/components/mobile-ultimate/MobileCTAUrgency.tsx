'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MOBILE CTA URGENCY - Òrbita Events
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Call to Action final con:
 * - Contador de disponibilidad en tiempo real
 * - Animaciones de urgencia
 * - Social proof
 * - Múltiples CTAs
 * - Garantía visible
 *
 * FIXED:
 * - Uses shared useAvailability hook with 30-min cache
 * - Rutas con locale
 * - Textos usando sistema de traducciones
 */

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMobile } from './MobileAppShell';
import { useTranslations } from 'next-intl';
import { useAvailability } from '@/hooks/usePublicData';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';

// ═══════════════════════════════════════════════════════════════════════════
// AVAILABILITY COUNTER
// ═══════════════════════════════════════════════════════════════════════════

function AvailabilityCounter() {
  const t = useTranslations('mobileCTA');
  const { data, isLoading } = useAvailability();
  const reduceMotion = useReducedMotion();

  // Process availability data from shared hook
  const availability = useMemo(() => {
    if (!data.monthlyAvailability || data.monthlyAvailability.length === 0) {
      return { saturdays: 3, month: t('months.october') };
    }

    // Get first month with availability data
    const monthData = data.monthlyAvailability[0];
    return {
      saturdays: monthData.availableSaturdays || 3,
      month: monthData.monthName || t('months.october'),
    };
  }, [data.monthlyAvailability, t]);

  const getUrgencyLevel = () => {
    if (availability.saturdays <= 1) return 'critical';
    if (availability.saturdays <= 2) return 'high';
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();
  
  const colors = {
    critical: {
      bg: 'from-amber-500/25 to-amber-600/10',
      border: 'border-amber-500/50',
      text: 'text-amber-300',
      glow: 'shadow-amber-500/25',
    },
    high: {
      bg: 'from-amber-400/20 to-amber-500/10',
      border: 'border-amber-400/40',
      text: 'text-amber-300',
      glow: 'shadow-amber-400/20',
    },
    normal: {
      bg: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20',
    },
  };

  const style = colors[urgencyLevel];

  if (isLoading) {
    return (
      <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative p-4 rounded-2xl bg-gradient-to-r ${style.bg} border ${style.border} ${style.glow} shadow-xl overflow-hidden`}
    >
      {/* Animated background for critical */}
      {urgencyLevel === 'critical' && (
        <div className="absolute inset-0 bg-amber-400/10" />
      )}

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-white/60 text-xs mb-1">{t('availability.badge')}</p>
          <p className={`font-black text-2xl ${style.text}`}>
            {availability.saturdays} {t('availability.saturdaysFree')}
          </p>
          <p className="text-white/50 text-xs">{availability.month}</p>
        </div>

        {urgencyLevel !== 'normal' && (
          <motion.div
            animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.05, 1] }}
            transition={reduceMotion ? { duration: 0 } : { duration: 1.2, repeat: Infinity }}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-amber-400/40 text-amber-200 text-xs font-semibold shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          >
            {urgencyLevel === 'critical' ? t('availability.lastOne') : t('availability.lastOnes')}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRUST BADGES
// ═══════════════════════════════════════════════════════════════════════════

function TrustBadges() {
  const t = useTranslations('mobileCTA');
  const reduceMotion = useReducedMotion();

  const badges = [
    { icon: '⭐', value: '5.0', labelKey: 'badges.rating' },
    { icon: '🎉', value: '50+', labelKey: 'badges.events' },
    { icon: '⚡', value: '2h', labelKey: 'badges.response' },
  ];

  return (
    <div className="flex justify-center gap-6">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.labelKey}
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduceMotion ? { duration: 0 } : { delay: i * 0.1 }}
          className="text-center"
        >
          <span className="text-xl">{badge.icon}</span>
          <p className="text-white font-bold text-lg">{badge.value}</p>
          <p className="text-white/60 text-xs">{t(badge.labelKey)}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function MobileCTAUrgency() {
  const { haptic, locale } = useMobile();
  const t = useTranslations('mobileCTA');
  const tCommon = useTranslations('common');
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-16 px-6">
      {/* Background decoration */}
      <div className="relative">
        {/* Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-[100px]" />

        <div className="relative">
          {/* Header */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-black text-white mb-3">
              {t('title.line1')}
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                {t('title.line2')}
              </span>
            </h2>
            <p className="text-white/60">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* Availability Counter */}
          <div className="mb-8">
            <AvailabilityCounter />
          </div>

          {/* CTAs */}
          <div className="space-y-3 mb-8">
            {/* Primary CTA */}
            <motion.a
              href={`/${locale}/contacto`}
              whileTap={{ scale: 0.98 }}
              onTapStart={() => haptic('medium')}
              className="relative block w-full group"
            >
              <div className="relative flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-black text-lg bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 shadow-[0_12px_30px_rgba(245,158,11,0.35)] ring-1 ring-amber-300/40 overflow-hidden">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.6),transparent_55%)] opacity-70"
                />
                <span className="relative">{tCommon('buttons.requestQuoteFree')}</span>
                <svg
                  className="relative w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </motion.a>

            {/* Secondary CTA */}
            <motion.a
              href={WHATSAPP_URL_WITH_MESSAGE('Hola! Vull info sobre events temàtics')}
              whileTap={{ scale: 0.98 }}
              onTapStart={() => haptic('light')}
              className="flex items-center justify-center gap-3 py-4 px-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 font-semibold text-white"
            >
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>{tCommon('buttons.whatsapp')} directe</span>
            </motion.a>
          </div>

          {/* Trust badges */}
          <TrustBadges />

          {/* Guarantee */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="text-green-400">🛡️</span>
              <span className="text-green-400 text-sm font-medium">
                {t('guarantee')}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
