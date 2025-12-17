'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// HERO ELEGANT v2.0 - Conversió màxima, mobile-first, amb traduccions
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroElegant() {
  const t = useTranslations('hero.elegant');

  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">

      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/img/hero-poster.webp"
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero-orbita.mp4" type="video/mp4" />
        </video>

        {/* Overlay - Més fosc per llegibilitat */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/80 via-[#0A0A0A]/60 to-[#0A0A0A]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-5 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Badge diferenciador - LA VENTAJA COMPETITIVA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 md:mb-8 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20"
          >
            <span className="text-amber-500 text-lg">{t('badgeEmoji')}</span>
            <span className="text-amber-400 text-sm font-medium tracking-wide">
              {t('badge')}
            </span>
          </motion.div>

          {/* Títol - BRUTAL i curt */}
          <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl lg:text-7xl font-bold text-white mb-5 md:mb-6 tracking-tight">
            {t('title1')}
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                {t('title2')}
              </span>
              {/* Accent line */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 origin-left"
              />
            </span>
          </h1>

          {/* Subtítol - CONCÍS */}
          <p className="text-lg md:text-xl text-white/70 mb-8 md:mb-10 max-w-xl mx-auto">
            {t('subtitle')}
            <span className="hidden md:inline"> {t('subtitleLocation')}</span>
          </p>

          {/* CTAs - WhatsApp PRIORITARI en mòbil */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-10 md:mb-12">

            {/* CTA Principal - WhatsApp (mòbil prioritza conversió directa) */}
            <a
              href={`https://wa.me/34699121023?text=${encodeURIComponent(t('whatsappMessage'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)] order-1 sm:order-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>{t('ctaWhatsapp')}</span>
              <span className="text-white/70 text-sm hidden sm:inline">{t('ctaWhatsappHint')}</span>
            </a>

            {/* CTA Secundari - Configurador */}
            <Link
              href="/configurador"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 transition-all order-2 sm:order-1"
            >
              <span>{t('ctaPrices')}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Social Proof - UNA sola mètrica potent + logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Rating destacat */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-white font-semibold">{t('rating')}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/60 text-sm">{t('socialProof')}</span>
            </div>

            {/* Logos de confiança - petit */}
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <span>{t('recommendedAt')}</span>
              <span className="font-semibold text-white/50">Bodas.net</span>
              <span>·</span>
              <span className="font-semibold text-white/50">Google</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator - Subtil */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 bg-amber-500 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
