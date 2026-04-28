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
import { PUBLIC_MOBILE_CTA_TRUST_BADGES, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';

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

      <div className="relative flex flex-col gap-2">
        <p className="text-white/60 text-xs uppercase tracking-wider">
          {t('availability.badge')}
        </p>
        <div className="flex items-end gap-2">
          <span className={`text-3xl font-black leading-none ${style.text}`}>
            {availability.saturdays}
          </span>
          <span className="text-white/80 text-sm font-semibold pb-0.5">
            {availability.saturdays <= 1
              ? t('availability.saturdayFree')
              : t('availability.saturdaysFree')}
          </span>
        </div>
        <p className="text-white/50 text-xs">{availability.month}</p>
        {urgencyLevel !== 'normal' && (
          <motion.p
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.8, 1, 0.8] }}
            transition={reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
            className="text-[11px] text-amber-200/80"
          >
            {urgencyLevel === 'critical' ? t('availability.lastOne') : t('availability.lastOnes')}
          </motion.p>
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

  const badges = PUBLIC_MOBILE_CTA_TRUST_BADGES;

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
    <section className="py-16 px-6 relative">
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
          <div className="space-y-2 mb-8">
            {/* Primary CTA - WhatsApp */}
            <motion.a
              href={WHATSAPP_URL_WITH_MESSAGE(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.98 }}
              onTapStart={() => haptic('medium')}
              onClick={() => {
                trackWhatsAppClick('mobile_cta_urgency');
                trackCTAClick('mobile_cta_urgency_whatsapp_primary', 'mobile_cta_urgency');
              }}
              className="relative block w-full"
            >
              <div className="relative flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-black font-black rounded-2xl shadow-[0_12px_36px_rgba(245,158,11,0.35)] overflow-hidden transition-all">
                <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
                <span>{tCommon('buttons.whatsapp')}</span>
              </div>
            </motion.a>

            {/* Secondary CTA - Formulari */}
            <motion.a
              href={`/${locale}/contacto`}
              whileTap={{ scale: 0.98 }}
              onTapStart={() => haptic('light')}
              onClick={() => trackCTAClick('mobile_cta_urgency_contact_secondary', 'mobile_cta_urgency')}
              className="flex items-center justify-center gap-2.5 py-3 px-5 bg-white/[0.07] backdrop-blur-md rounded-2xl border border-white/[0.12] font-semibold text-white/80 text-sm"
            >
              <svg className="w-4 h-4 text-amber-400/70 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{tCommon('buttons.requestQuoteFree')}</span>
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
