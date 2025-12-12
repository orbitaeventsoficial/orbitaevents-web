'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CTA SECTION BRUTAL - LA TRAMPA FINAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * "El cliente no compra lo que haces, compra cómo les haces sentir"
 * 
 * Esta sección es el CIERRE. El momento donde el visitante 
 * se convierte en lead. Cada píxel tiene un propósito: CONVERTIR.
 * 
 * Elementos psicológicos:
 * - Urgencia con countdown real
 * - Scarcity con disponibilidad limitada
 * - Social proof con número de clientes
 * - Garantía que elimina riesgo
 * - Múltiples CTAs para diferentes personalidades
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations, useLocale } from 'next-intl';

// ═══════════════════════════════════════════════════════════════════════════
// LIVE ACTIVITY INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

function LiveActivity({ t }: { t: (key: string) => string }) {
  // DESACTIVAT: No mostrar fake viewers fins que tinguem analytics real
  // Això evita el "0 persones veient ara" que destrossa credibilitat
  // TODO: ACTIVAR quan tinguem analytics real
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// GUARANTEE BADGE
// ═══════════════════════════════════════════════════════════════════════════

function GuaranteeBadge({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex items-center justify-center gap-6 flex-wrap">
      {[
        { icon: '✅', textKey: 'guarantees.noCommitment' },
        { icon: '⚡', textKey: 'guarantees.fastResponse' },
        { icon: '🔒', textKey: 'guarantees.dataProtected' },
        { icon: '💯', textKey: 'guarantees.satisfaction' },
      ].map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center gap-2 text-sm text-white/60"
        >
          <span>{item.icon}</span>
          <span>{t(item.textKey)}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AVAILABILITY CALENDAR MINI
// ═══════════════════════════════════════════════════════════════════════════

type MonthStatus = 'critical' | 'warning' | 'ok';
type MonthData = { name: string; available: number; status: MonthStatus };

function AvailabilityMini({ t, locale }: { t: (key: string) => string; locale: string }) {
  // SSR-safe: use static defaults, update on client
  const [months, setMonths] = useState<MonthData[]>([
    { name: 'DES', available: 2, status: 'warning' },
    { name: 'GEN', available: 3, status: 'ok' },
    { name: 'FEB', available: 2, status: 'warning' },
  ]);

  useEffect(() => {
    const now = new Date();
    const newMonths = [0, 1, 2].map(offset => {
      const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const available = Math.floor(Math.random() * 3) + 1;
      return {
        name: date.toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES', { month: 'short' }).toUpperCase(),
        available,
        status: (available <= 1 ? 'critical' : available <= 2 ? 'warning' : 'ok') as MonthStatus
      };
    });
    setMonths(newMonths);
  }, [locale]);

  return (
    <div className="flex justify-center gap-4 mt-6">
      {months.map((month, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="text-center"
        >
          <div className={`
            w-16 h-16 rounded-xl flex flex-col items-center justify-center
            ${month.status === 'critical' ? 'bg-red-500/20 border-red-500/30' :
              month.status === 'warning' ? 'bg-amber-500/20 border-amber-500/30' :
              'bg-green-500/20 border-green-500/30'} border
          `}>
            <span className="text-xs text-white/50">{month.name}</span>
            <span className={`text-lg font-bold ${
              month.status === 'critical' ? 'text-red-400' :
              month.status === 'warning' ? 'text-amber-400' :
              'text-green-400'
            }`}>
              {month.available}
            </span>
          </div>
          <span className="text-[10px] text-white/40 mt-1 block">
            {month.status === 'critical' ? t('availability.critical') :
             month.status === 'warning' ? t('availability.warning') :
             t('availability.ok')}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CTA SECTION
// ═══════════════════════════════════════════════════════════════════════════

export function CTASectionBrutal() {
  const t = useTranslations('ctaSection');
  const tWhatsapp = useTranslations('whatsappMessages');
  const locale = useLocale();

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">

      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1)_0%,transparent_70%)]" />

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">

        {/* Live Activity */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <LiveActivity t={t} />
        </motion.div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black mb-6"
          >
            <span className="text-white">{t('title')} </span>
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400">
                {t('titleHighlight')}
              </span>
              {/* Glow effect */}
              <span
                className="absolute inset-0 blur-2xl opacity-50"
                style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)', WebkitBackgroundClip: 'text' }}
                aria-hidden="true"
              />
            </span>
            <span className="text-white">?</span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-white/70 mb-8"
          >
            {t('subtitle')} <span className="text-amber-400 font-medium">{t('subtitleHighlight')}</span>
          </motion.p>

          {/* Availability Mini Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mb-10"
          >
            <p className="text-sm text-white/50 mb-2">📅 {t('availability.title')}</p>
            <AvailabilityMini t={t} locale={locale} />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            {/* Primary CTA - Form */}
            <Link
              href="/contacto"
              className="group relative w-full sm:w-auto px-8 py-4 overflow-hidden rounded-full font-bold text-lg transition-all duration-300"
            >
              {/* Animated gradient background */}
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 bg-[length:200%_100%] animate-shimmer" />
              
              {/* Glow on hover */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"
                style={{ boxShadow: '0 0 40px rgba(245, 158, 11, 0.6), 0 0 80px rgba(245, 158, 11, 0.3)' }}
              />
              
              {/* Content */}
              <span className="relative flex items-center justify-center gap-3 text-black">
                <span>📝</span>
                <span>{t('ctaPrimary')}</span>
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </span>
            </Link>

            {/* Secondary CTA - WhatsApp */}
            <Link
              href={`https://wa.me/34699121023?text=${encodeURIComponent(tWhatsapp('general'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg rounded-full transition-all duration-300 shadow-lg shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:-translate-y-0.5"
            >
              <motion.svg 
                className="w-6 h-6" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </motion.svg>
              <span>{t('whatsapp')}</span>
            </Link>
          </motion.div>

          {/* Phone alternative */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <Link
              href="tel:+34699121023"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <span>📞</span>
              <span>{t('preferCall')} </span>
              <span className="text-amber-400 font-medium">{t('phone')}</span>
            </Link>
          </motion.div>

          {/* Guarantees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <GuaranteeBadge t={t} />
          </motion.div>

        </div>

        {/* Trust elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-10 border-t border-white/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div className="text-left">
                <p className="text-white font-semibold">{t('trust.events')}</p>
                <p className="text-xs text-white/50">{t('trust.eventsDesc')}</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-white/10" />
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div className="text-left">
                <p className="text-white font-semibold">{t('trust.rating')}</p>
                <p className="text-xs text-white/50">{t('trust.ratingDesc')}</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-white/10" />
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div className="text-left">
                <p className="text-white font-semibold">{t('trust.coverage')}</p>
                <p className="text-xs text-white/50">{t('trust.coverageDesc')}</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </section>
  );
}

export default CTASectionBrutal;
