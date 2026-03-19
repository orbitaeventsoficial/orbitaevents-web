'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

// ─── Curated hero images — 5 categories, the best of each ──────────────────

const HERO_IMAGES = [
  '/img/portfolio/discomovil/discomovil-01.avif',
  '/img/portfolio/bodas/bodas-01.avif',
  '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif',
  '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.avif',
  '/img/portfolio/eventos-empresa/eventos-empresa-01.avif',
];

// Ken Burns directions for variety
const KB_DIRECTIONS = [
  { x: [0, -3], y: [0, -2], scale: [1, 1.12] },
  { x: [0, 3], y: [0, -1], scale: [1, 1.10] },
  { x: [0, -2], y: [0, 2], scale: [1, 1.14] },
  { x: [0, 2], y: [0, -3], scale: [1, 1.11] },
  { x: [0, -1], y: [0, 1], scale: [1, 1.13] },
];

const SLIDE_DURATION = 6000;

// ─── Cinematic Slide ────────────────────────────────────────────────────────

function CinematicSlide({
  src,
  active,
  direction,
  reduceMotion,
  priority,
}: {
  src: string;
  active: boolean;
  direction: typeof KB_DIRECTIONS[0];
  reduceMotion: boolean | null;
  priority: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{
        opacity: active ? 1 : 0,
        x: active && !reduceMotion ? direction.x : 0,
        y: active && !reduceMotion ? direction.y : 0,
        scale: active && !reduceMotion ? direction.scale : 1,
      }}
      transition={{
        opacity: { duration: 1.8, ease: [0.4, 0, 0.2, 1] },
        x: { duration: SLIDE_DURATION / 1000, ease: 'linear' },
        y: { duration: SLIDE_DURATION / 1000, ease: 'linear' },
        scale: { duration: SLIDE_DURATION / 1000, ease: 'linear' },
      }}
    >
      <Image
        src={src}
        alt="Òrbita Events"
        fill
        className="object-cover"
        style={{ filter: 'brightness(0.45) saturate(1.2)' }}
        sizes="100vw"
        priority={priority}
        quality={80}
      />
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
  const [loaded, setLoaded] = useState(false);
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Entrada amb delay per assegurar que el primer frame renderitza
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Rotate text every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = useCallback((i: number) => setSlideIndex(i), []);

  return (
    <section
      ref={sectionRef}
      aria-label="Hero"
      className="relative min-h-[100svh] flex items-center overflow-hidden"
    >
      {/* ── Background — Ken Burns slides ── */}
      <div className="absolute inset-0" aria-hidden="true">
        <AnimatePresence initial={false}>
          {HERO_IMAGES.map((src, i) => (
            <CinematicSlide
              key={src}
              src={src}
              active={i === slideIndex}
              direction={KB_DIRECTIONS[i % KB_DIRECTIONS.length]}
              reduceMotion={reduceMotion}
              priority={i === 0}
            />
          ))}
        </AnimatePresence>

        {/* Gradient overlays — deep cinematic vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

        {/* Subtle amber glow — bottom left, behind content */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-amber-500/[0.04] blur-[120px] rounded-full" />

        {/* Film grain */}
        <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
      </div>

      {/* ── Slide progress indicators — interactive ── */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20 flex items-center gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className="group relative h-6 flex items-center cursor-pointer"
          >
            <div className="h-[2px] rounded-full transition-all duration-700 bg-white/20 group-hover:bg-white/40"
              style={{ width: i === slideIndex ? 32 : 8 }}
            />
            {i === slideIndex && (
              <motion.div
                className="absolute left-0 h-[2px] rounded-full bg-amber-400"
                initial={{ width: 0 }}
                animate={{ width: 32 }}
                transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
                key={slideIndex}
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Content — centred vertically ── */}
      <div className="relative z-10 w-full py-32 md:py-40">
        <div className="container mx-auto px-6 md:px-8">
          <div className="max-w-4xl">

            {/* 1. Badge */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2.5 mb-6 md:mb-8 px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-md">
                <span className="text-amber-400 text-base">{t('badgeEmoji')}</span>
                <span className="text-white/80 text-xs md:text-sm font-semibold tracking-[0.15em] uppercase">
                  {t('badge')}
                </span>
              </div>
            </motion.div>

            {/* 2. Title with morphing text */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-[2.75rem] leading-[0.92] md:text-7xl lg:text-[5.5rem] font-black text-white tracking-[-0.02em]">
                {t('title1')}
                <br />
                <span className="relative inline-block mt-1 md:mt-2">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={textIndex}
                      initial={reduceMotion ? false : { opacity: 0, y: 12, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: 'blur(6px)' }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="inline-block bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent"
                    >
                      {rotatingTexts[textIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>
            </motion.div>

            {/* 3. Subtitle — readable */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-base md:text-xl text-white/70 mt-5 md:mt-7 max-w-xl leading-relaxed font-light">
                {t('subtitle')}
              </p>
            </motion.div>

            {/* 4. CTAs */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col sm:flex-row items-start gap-3 mt-8 md:mt-10">
                {/* Primary CTA — ambient glow */}
                <Link
                  href="/configurador"
                  onClick={() => trackCTAClick('hero_configurator_primary', 'hero_elegant')}
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  <div className="absolute -inset-1 bg-amber-500/20 rounded-3xl blur-xl group-hover:bg-amber-500/30 transition-colors duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-[length:200%_100%] rounded-2xl animate-[shimmer_3s_ease-in-out_infinite]" />
                  <span className="relative z-10 text-zinc-900 font-black text-base md:text-lg">
                    {t('ctaConfigurator')}
                  </span>
                  <svg className="relative z-10 w-5 h-5 text-zinc-900 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>

                {/* WhatsApp CTA */}
                <a
                  href={WHATSAPP_URL_WITH_MESSAGE(t('whatsappMessage'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick('hero_elegant')}
                  className="group inline-flex items-center gap-2.5 px-6 py-4 md:px-8 md:py-5 rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-sm text-white hover:bg-[#25D366]/15 hover:border-[#25D366]/40 transition-all duration-300"
                >
                  <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.352 0-4.556-.725-6.379-1.963l-.447-.305-2.948.988.988-2.948-.305-.447A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                  <span className="font-semibold text-sm md:text-base">{tCommon('buttons.whatsapp')}</span>
                </a>
              </div>
            </motion.div>

            {/* 5. Social proof — three stats */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={loaded ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 1.4, ease: 'easeOut' }}
            >
              <div className="flex flex-wrap items-center gap-6 mt-10 md:mt-12">
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-white text-sm font-bold">{t('rating')}</span>
                </div>

                <span className="w-px h-4 bg-white/20" />

                {/* Events */}
                <span className="text-white/80 text-sm">{t('socialProof')}</span>

                <span className="w-px h-4 bg-white/20 hidden sm:block" />

                {/* Response time */}
                <span className="text-white/80 text-sm hidden sm:block">
                  {'<2h '}
                  {t('responseLabel')}
                </span>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 2.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
      >
        <motion.div
          animate={reduceMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 border border-white/25 rounded-full flex justify-center pt-1.5"
        >
          <div className="w-1 h-1.5 bg-amber-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
