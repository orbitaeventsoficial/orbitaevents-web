'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useState, useEffect } from 'react';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

export default function HeroElegant() {
  const t = useTranslations('hero.elegant');
  const tCommon = useTranslations('common');
  const rotatingTexts = t.raw('rotatingTexts') as string[];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  return (
    <section aria-label="Hero" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">

      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          disablePictureInPicture
          poster="/img/hero-poster.webp"
          className="w-full h-full object-cover"
        >
          <source src="/video/Herovideo.mp4" type="video/mp4" />
        </video>
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
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-4 md:mb-5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-500 text-lg">{t('badgeEmoji')}</span>
            <span className="text-amber-400 text-sm font-medium tracking-wide">
              {t('badge')}
            </span>
          </div>

          {/* Title — direct, with rotating service type */}
          <h1 className="text-[2.5rem] leading-[1.05] md:text-6xl lg:text-7xl font-black text-white mb-3 md:mb-4 tracking-tight">
            {t('title1')}
            <br />
            <span className="relative block w-full min-h-[1.2em]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentIndex}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
                  className="relative block w-full text-center bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.3))',
                  }}
                >
                  {rotatingTexts[currentIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Subtitle — territory + promise */}
          <p className="text-lg md:text-xl text-white/70 mb-6 md:mb-8 max-w-xl mx-auto">
            {t('subtitle')}
          </p>

          {/* CTAs — Packs primary, Configurator secondary */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6 md:mb-8">

            {/* CTA Principal — Packs */}
            <Link
              href="/packs"
              onClick={() => trackCTAClick('hero_packs_primary', 'hero_elegant')}
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 overflow-hidden px-8 py-4 rounded-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl" />
              <span className="relative z-10 text-zinc-900 font-black text-lg flex items-center gap-2">
                <span>{t('ctaPacks')}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>

            {/* CTA Secundari — Configurador */}
            <Link
              href="/configurador"
              onClick={() => trackCTAClick('hero_configurator_secondary', 'hero_elegant')}
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-8 py-4 rounded-xl border border-white/20 hover:border-white/30 transition-all"
            >
              <span>{t('ctaConfigurator')}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Social Proof + WhatsApp */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Rating */}
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-white font-semibold text-sm">{t('rating')}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/50 text-sm">{t('socialProof')}</span>
            </div>

            {/* WhatsApp — auxiliary link */}
            <a
              href={WHATSAPP_URL_WITH_MESSAGE(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWhatsAppClick('hero_elegant')}
              className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-[#25D366] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.352 0-4.556-.725-6.379-1.963l-.447-.305-2.948.988.988-2.948-.305-.447A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              <span>{tCommon('buttons.whatsapp')}</span>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
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
