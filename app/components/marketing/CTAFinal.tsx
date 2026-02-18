'use client';

import { Link } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePublicStats, useAvailability } from '@/hooks/usePublicData';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

// ═══════════════════════════════════════════════════════════════════════════
// CTA FINAL BRUTAL v2.1 - i18n complet
// ═══════════════════════════════════════════════════════════════════════════

const Icons = {
  WhatsApp: () => (
    <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Fire: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-5.07 0-9-4.03-9-9 0-3.87 2.47-7.17 5.91-8.41L12 2l3.09 3.59C18.53 6.83 21 10.13 21 14c0 5.07-4.03 9-9 9z"/>
    </svg>
  ),
  Arrow: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
};

export default function CTAFinal() {
  const t = useTranslations('homeSections.ctaFinal');
  const { currentMonthAvailable, data: availData } = useAvailability();
  const { stats } = usePublicStats();
  const responseValue = stats.responseTime ? `<${stats.responseTime}` : '<2h';

  const monthName = availData.monthlyAvailability[0]?.monthName || '';
  const satStatus: 'scarce' | 'limited' | 'available' =
    currentMonthAvailable <= 1 ? 'scarce' :
    currentMonthAvailable <= 2 ? 'limited' :
    'available';

  const statusColors: Record<'scarce' | 'limited' | 'available', string> = {
    scarce: 'from-red-500 to-rose-500',
    limited: 'from-amber-500 to-orange-500',
    available: 'from-emerald-500 to-teal-500',
  };

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">

          {/* Urgency badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-6"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${statusColors[satStatus]} rounded-full text-white text-sm font-semibold`}>
              <Icons.Fire />
              <span>
                {currentMonthAvailable} {currentMonthAvailable === 1 ? t('saturdaysSingular') : t('saturdaysPlural')} {monthName}
              </span>
              <span className="text-white/80 text-xs">{t(`status.${satStatus}`)}</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {t('title1')}
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {t('title2')}
              </span>
            </h2>
            <p className="text-lg text-white/60">
              {t('subtitle')}
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-10"
          >
            {/* WhatsApp - PRIMARI - con hover verde premium */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('whatsappMsg'))}`}
              target="_blank" rel="noopener noreferrer"
              onClick={() => {
                trackWhatsAppClick('cta_final');
                trackCTAClick('cta_final_whatsapp_primary', 'cta_final');
              }}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-[#25D366] rounded-2xl transition-all overflow-hidden"
            >
              {/* Glow de fondo al hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Shadow verde al hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity" />

              <span className="relative z-10 flex items-center gap-3">
                <Icons.WhatsApp />
                <span className="font-bold text-white text-lg">{t('ctaPrimary')}</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
              </span>
            </a>

            {/* Configurador - SECUNDARI - mejorado */}
            <Link
              href="/configurador"
              onClick={() => trackCTAClick('cta_final_configurator_secondary', 'cta_final')}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-2xl transition-all overflow-hidden"
            >
              {/* Efecto de shine */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />

              <span className="relative z-10 flex items-center gap-2 text-white font-semibold">
                <span>{t('ctaSecondary')}</span>
                <Icons.Arrow />
              </span>
            </Link>
          </motion.div>

          {/* Trust - CENTRADO */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm mb-6 text-center"
          >
            <span className="flex items-center gap-2 justify-center">
              <span className="text-xl">🎯</span>
              <span><strong className="text-white">+{stats.totalEvents}</strong> {t('events')}</span>
            </span>
            <span className="hidden sm:block w-px h-4 bg-white/20" />
            <span className="flex items-center gap-2 justify-center">
              <span className="text-xl">⭐</span>
              <span><strong className="text-white">5.0/5</strong> {t('rating')}</span>
            </span>
            <span className="hidden sm:block w-px h-4 bg-white/20" />
            <span className="flex items-center gap-1 justify-center">
              <Icons.Clock />
              <span><strong className="text-white">{responseValue}</strong> {t('response')}</span>
            </span>
          </motion.div>

          {/* Guarantee - CENTRADO */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/60 text-sm text-center"
          >
            {t('guarantee')}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
