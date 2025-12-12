'use client';

/**
 * HeroCinematic.tsx - VERSIÓ MULTIIDIOMA
 *
 * Canvis clau:
 * - Usa useTranslations de next-intl
 * - Suporta català i espanyol
 * - Formulari com a CTA principal
 * - Botó fix a mòbil sempre visible
 * - SENSE loader
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function HeroCinematic() {
  const t = useTranslations('hero');
  const tWhatsapp = useTranslations('whatsappMessages');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Apareix immediatament, sense loader
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-black">
      {/* VIDEO BACKGROUND - Sense espera */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setIsVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isVideoLoaded ? 'opacity-40' : 'opacity-0'
        }`}
        poster="/img/hero-home-visual.jpg"
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>

      {/* Gradient mentre carrega - ja visible */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-black via-purple-950/30 to-black transition-opacity duration-700 ${
          isVideoLoaded ? 'opacity-60' : 'opacity-100'
        }`}
      />

      {/* Overlays per llegibilitat */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* CONTINGUT */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className="relative z-10 min-h-[100svh] flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-24 pb-36 sm:pb-24"
      >
        {/* HEADLINE BRUTAL - Imatge mental */}
        <motion.h1 variants={itemVariants} className="max-w-4xl">
          <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white/90 leading-tight">
            {t('headline1')}
          </span>
          <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mt-2">
            {t('headline2')}
          </span>
        </motion.h1>

        {/* PUNCH LINE - 2 paraules */}
        <motion.p
          variants={itemVariants}
          className="mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-bold text-amber-400"
        >
          {t('punchline')}
        </motion.p>

        {/* SERVEIS - Icones minimalistes */}
        <motion.p
          variants={itemVariants}
          className="mt-5 text-base sm:text-lg text-white/70 tracking-wide"
        >
          {t('services')}
        </motion.p>

        {/* UBICACIÓ + RESPOSTA - Una línia */}
        <motion.div
          variants={itemVariants}
          className="mt-4 flex items-center gap-2 text-sm text-white/50"
        >
          <span>📍 {t('location')}</span>
          <span className="text-white/30">·</span>
          <span>⚡ {t('response')}</span>
        </motion.div>

        {/* CTA PRINCIPAL - FORMULARI */}
        <motion.div variants={itemVariants} className="mt-8 sm:mt-10 w-full sm:w-auto">
          <Link
            href="/contacto"
            className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-full transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-400/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>📝</span>
            <span>{t('cta.primary')}</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>

        {/* CTAs SECUNDARIS - Petits, discrets */}
        <motion.div
          variants={itemVariants}
          className="mt-4 flex items-center gap-4 text-sm"
        >
          <Link
            href={`https://wa.me/34699121023?text=${encodeURIComponent(tWhatsapp('general'))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-green-400 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>{t('cta.whatsapp')}</span>
          </Link>
          <span className="text-white/20">·</span>
          <Link
            href="tel:+34699121023"
            className="text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>📞</span>
            <span>{t('cta.call')}</span>
          </Link>
        </motion.div>

        {/* ESCASSETAT - Badge vermell */}
        <motion.div variants={itemVariants} className="mt-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-sm font-medium backdrop-blur-sm">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            {t('scarcity')}
          </span>
        </motion.div>
      </motion.div>

      {/* SCROLL INDICATOR - Només desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </motion.div>
      </motion.div>

      {/* CTA FIX MÒBIL - Sempre visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/95 to-transparent sm:hidden">
        <Link
          href="/contacto"
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-amber-500 active:bg-amber-600 text-black font-bold text-base rounded-full shadow-lg shadow-amber-500/30"
        >
          <span>📝</span>
          <span>{t('mobileCta')}</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

export default HeroCinematic;
