'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useState, useEffect } from 'react';

import HeroUrgencyBadge from './HeroUrgencyBadge';
// ═══════════════════════════════════════════════════════════════════════════
// HERO ELEGANT v2.0 - Conversió màxima, mobile-first, amb traduccions
// ═══════════════════════════════════════════════════════════════════════════

export default function HeroElegant() {
  const t = useTranslations('hero.elegant');
  const rotatingTexts = t.raw('rotatingTexts') as string[];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotar textos cada 5 segons (més lent per millor lectura)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

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
            className="inline-flex items-center gap-2 mb-4 md:mb-5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20"
          >
            <span className="text-amber-500 text-lg">{t('badgeEmoji')}</span>
            <span className="text-amber-400 text-sm font-medium tracking-wide">
              {t('badge')}
            </span>
          </motion.div>

          {/* Títol - BRUTAL i curt amb text rotatiu */}
          <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl lg:text-7xl font-black text-white mb-3 md:mb-4 tracking-tight">
            {t('title1')}
            <br />
            <span className="relative inline-block min-h-[1.2em]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                  className="relative inline-block"
                >
                  {/* Text amb gradient i glow */}
                  <span
                    className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"
                    style={{
                      textShadow: '0 0 40px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.2)',
                      filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.3))',
                    }}
                  >
                    {rotatingTexts[currentIndex]}
                  </span>

                  {/* Línia decorativa animada */}
                  <motion.span
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="absolute -bottom-2 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent origin-center"
                  />

                  {/* Efecte de partícules/brillantor als costats */}
                  <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                  <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Subtítol - CONCÍS */}
          <p className="text-lg md:text-xl text-white/70 mb-4 max-w-xl mx-auto">
            {t('subtitle')}
            <span className="hidden md:inline"> {t('subtitleLocation')}</span>
          </p>

          {/* Badge de Urgencia - Halloween / Món Màgic */}
          <div className="mb-5 md:mb-6">
            <HeroUrgencyBadge />
          </div>

          {/* CTAs - Contacte PRIORITARI */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6 md:mb-8">

            {/* CTA Principal - Formulario de Contacto */}
            <Link
              href="/contacto"
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-900 font-bold px-8 py-4 rounded-xl transition-all hover:shadow-[0_8px_30px_rgba(251,191,36,0.4)] order-1"
            >
              <span>{t('ctaContact')}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            {/* CTA Secundari - Ver precios */}
            <Link
              href="/configurador"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-medium px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 transition-all order-2"
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
              <span className="text-white/60">·</span>
              <span className="text-white/60 text-sm">{t('socialProof')}</span>
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
