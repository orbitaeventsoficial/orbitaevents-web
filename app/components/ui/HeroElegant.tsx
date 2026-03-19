'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

// ─── Pool complet d'imatges portfolio per al carousel ────────────────────────

const ALL_PORTFOLIO_IMAGES = [
  // Discomòbil
  ...Array.from({ length: 20 }, (_, i) => `/img/portfolio/discomovil/discomovil-${String(i + 1).padStart(2, '0')}.avif`),
  // Bodas
  ...Array.from({ length: 4 }, (_, i) => `/img/portfolio/bodas/bodas-${String(i + 1).padStart(2, '0')}.avif`),
  // Festes privades
  ...Array.from({ length: 12 }, (_, i) => `/img/portfolio/fiestas-privadas/fiestas-privadas-${String(i + 1).padStart(2, '0')}.avif`),
  // Halloween
  ...Array.from({ length: 7 }, (_, i) => `/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-${String(i + 1).padStart(2, '0')}.avif`),
  // Món Màgic
  ...Array.from({ length: 5 }, (_, i) => `/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-${String(i + 1).padStart(2, '0')}.avif`),
  // Empreses
  ...Array.from({ length: 8 }, (_, i) => `/img/portfolio/eventos-empresa/eventos-empresa-${String(i + 1).padStart(2, '0')}.avif`),
  // Festes infantils
  ...Array.from({ length: 5 }, (_, i) => `/img/portfolio/fiestas-infantiles/fiestas-infantiles-${String(i + 1).padStart(2, '0')}.avif`),
  // Producció tècnica
  ...Array.from({ length: 4 }, (_, i) => `/img/portfolio/produccion-tecnica/produccion-tecnica-${String(i + 1).padStart(2, '0')}.avif`),
  // Alquiler equip
  ...Array.from({ length: 4 }, (_, i) => `/img/portfolio/alquiler-equipo/alquiler-equipo-${String(i + 1).padStart(2, '0')}.avif`),
];

const HERO_SLIDE_COUNT = 8;

function shuffleAndPick(arr: string[], count: number): string[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

// ─── Stagger wrapper ────────────────────────────────────────────────────────

function StaggerItem({
  children,
  delay,
  reduceMotion,
}: {
  children: React.ReactNode;
  delay: number;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────

export default function HeroElegant() {
  const t = useTranslations('hero.elegant');
  const tCommon = useTranslations('common');
  const rotatingTexts = t.raw('rotatingTexts') as string[];
  const [textIndex, setTextIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  // Escollir imatges aleatòries un sol cop per sessió
  const heroSlides = useMemo(() => shuffleAndPick(ALL_PORTFOLIO_IMAGES, HERO_SLIDE_COUNT), []);

  // Rotate text every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Rotate background slides every 5s (offset from text)
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  return (
    <section
      aria-label="Hero"
      className="relative min-h-[100svh] flex items-end overflow-hidden pointer-events-none"
    >
      {/* ── Background carousel ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Portfolio image slides with crossfade */}
        {heroSlides.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[2s] ease-in-out will-change-[opacity]"
            style={{ opacity: i === slideIndex ? 1 : 0 }}
          >
            <Image
              src={src}
              alt="Òrbita Events"
              fill
              className="object-cover"
              style={{ filter: 'brightness(0.55) saturate(1.15)' }}
              sizes="100vw"
              priority={i < 2}
              quality={75}
            />
          </div>
        ))}


        {/* Gradient overlays — cinematic */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
      </div>

      {/* ── Slide indicators ── */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 flex items-center gap-1.5 pointer-events-none">
        {heroSlides.map((_, i) => (
          <div
            key={i}
            className={`h-0.5 rounded-full transition-all duration-700 ${
              i === slideIndex ? 'w-8 bg-amber-400' : 'w-2 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* ── Content — anchored to bottom ── */}
      <div className="relative z-10 w-full pb-20 md:pb-28 pt-32 pointer-events-none">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-4xl">

            {/* 1. Badge */}
            <StaggerItem delay={0.2} reduceMotion={reduceMotion}>
              <div className="inline-flex items-center gap-2.5 mb-6 md:mb-8 px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.15] backdrop-blur-md">
                <span className="text-amber-400 text-base">{t('badgeEmoji')}</span>
                <span className="text-white/90 text-xs md:text-sm font-semibold tracking-[0.15em] uppercase">
                  {t('badge')}
                </span>
              </div>
            </StaggerItem>

            {/* 2. Title — left-aligned, big impact */}
            <StaggerItem delay={0.5} reduceMotion={reduceMotion}>
              <h1 className="text-[2.75rem] leading-[0.95] md:text-7xl lg:text-[5.5rem] font-black text-white tracking-tight">
                {t('title1')}
                <br />
                <span className="relative inline-block min-h-[2.3em] mt-1 md:mt-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={textIndex}
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      className="inline-block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent"
                    >
                      {rotatingTexts[textIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>
            </StaggerItem>

            {/* 3. Subtitle */}
            <StaggerItem delay={0.9} reduceMotion={reduceMotion}>
              <p className="text-base md:text-xl text-white/55 mt-5 md:mt-7 max-w-lg leading-relaxed">
                {t('subtitle')}
              </p>
            </StaggerItem>

            {/* 4. CTAs — primary + WhatsApp side by side */}
            <StaggerItem delay={1.2} reduceMotion={reduceMotion}>
              <div className="flex flex-col sm:flex-row items-start gap-3 mt-8 md:mt-10">
                {/* Primary CTA */}
                <Link
                  href="/configurador"
                  onClick={() => trackCTAClick('hero_configurator_primary', 'hero_elegant')}
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-transform hover:scale-[1.03] active:scale-[0.98] pointer-events-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-[length:200%_100%] rounded-2xl animate-[shimmer_3s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: '0 0 40px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.15)' }} />
                  <span className="relative z-10 text-zinc-900 font-black text-base md:text-lg">
                    {t('ctaConfigurator')}
                  </span>
                  <svg className="relative z-10 w-5 h-5 text-zinc-900 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>

                {/* WhatsApp CTA — visible secondary */}
                <a
                  href={WHATSAPP_URL_WITH_MESSAGE(t('whatsappMessage'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick('hero_elegant')}
                  className="group inline-flex items-center gap-2.5 px-6 py-4 md:px-8 md:py-5 rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-sm text-white hover:bg-[#25D366]/15 hover:border-[#25D366]/40 transition-all duration-300 pointer-events-auto"
                >
                  <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.352 0-4.556-.725-6.379-1.963l-.447-.305-2.948.988.988-2.948-.305-.447A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  <span className="font-semibold text-sm md:text-base">{tCommon('buttons.whatsapp')}</span>
                </a>
              </div>
            </StaggerItem>

            {/* 5. Social proof — inline, subtle */}
            <StaggerItem delay={1.5} reduceMotion={reduceMotion}>
              <div className="flex items-center gap-4 mt-8 md:mt-10">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white/90 text-sm font-medium">{t('rating')}</span>
                <span className="text-white/30">|</span>
                <span className="text-white/70 text-sm">{t('socialProof')}</span>
              </div>
            </StaggerItem>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 2, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 bg-amber-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
