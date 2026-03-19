'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { trackCTAClick } from '@/app/lib/analytics';

interface HeroMediaItem {
  id: string;
  url: string;
  type: 'video' | 'image';
  label: string;
}

// Fallback fins que l'API respongui (imatges alta resolució)
const FALLBACK: HeroMediaItem[] = [
  { id: 'video-original', url: '/videos/hero-orbita-mobile.mp4', type: 'video', label: 'Vídeo' },
  { id: 'img-disco-01', url: '/img/portfolio/discomovil/discomovil-01.avif', type: 'image', label: 'Discomòbil' },
  { id: 'img-bodas-04', url: '/img/portfolio/bodas/bodas-04.avif', type: 'image', label: 'Bodes' },
  { id: 'img-halloween-01', url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif', type: 'image', label: 'Halloween' },
  { id: 'img-magic-05', url: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif', type: 'image', label: 'Món Màgic' },
  { id: 'img-empresa-01', url: '/img/portfolio/eventos-empresa/eventos-empresa-01.avif', type: 'image', label: 'Empreses' },
];

const IMAGE_DURATION = 6000;
const VIDEO_MIN_DURATION = 8000;

// Ken Burns per imatges
const KB = [
  { x: [0, -1.5], y: [0, -1], scale: [1, 1.05] },
  { x: [0, 1.5], y: [0, -0.5], scale: [1, 1.04] },
  { x: [0, -1], y: [0, 1], scale: [1, 1.06] },
  { x: [0, 1], y: [0, -1.5], scale: [1, 1.04] },
  { x: [0, -0.5], y: [0, 0.5], scale: [1, 1.05] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HeroElegant() {
  const t = useTranslations('hero.elegant');
  const rotatingTexts = t.raw('rotatingTexts') as string[];
  const [textIndex, setTextIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<HeroMediaItem[]>(FALLBACK);
  const [videoReady, setVideoReady] = useState(false);
  const reduceMotion = useReducedMotion();

  // Fetch media from API + shuffle
  useEffect(() => {
    fetch('/api/hero-media')
      .then((r) => r.json())
      .then((data: HeroMediaItem[]) => {
        if (data.length > 0) setMediaItems(shuffle(data));
      })
      .catch(() => {});
  }, []);

  const currentItem = mediaItems[slideIndex % mediaItems.length];
  const kbDir = KB[slideIndex % KB.length];

  // Rotate text
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [rotatingTexts.length]);

  // Rotate slides
  useEffect(() => {
    if (mediaItems.length <= 1) return;

    const duration = currentItem?.type === 'video' ? VIDEO_MIN_DURATION : IMAGE_DURATION;
    const timer = setTimeout(() => {
      setSlideIndex((prev) => (prev + 1) % mediaItems.length);
      setVideoReady(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [slideIndex, mediaItems, currentItem?.type]);

  const handleVideoReady = useCallback(() => {
    setTimeout(() => setVideoReady(true), 200);
  }, []);

  return (
    <section
      aria-label="Hero"
      className="relative min-h-[100svh] flex items-end overflow-hidden"
    >
      {/* ── Background — mixed media ── */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Poster fallback */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/img/hero-poster.webp')" }}
        />

        {/* Active slide — crossfade (no mode="wait") per evitar gap on es veu el poster */}
        <AnimatePresence>
          {currentItem.type === 'video' ? (
            <motion.div
              key={`${currentItem.id}-${slideIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              {/* Vídeo completament ocult fins onCanPlay — inline style síncron */}
              <video
                key={currentItem.url}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                disableRemotePlayback
                disablePictureInPicture
                className="w-full h-full object-cover"
                style={{
                  opacity: videoReady ? 1 : 0,
                  transition: 'opacity 0.8s ease',
                  filter: 'brightness(0.45) saturate(1.2)',
                }}
                onCanPlay={handleVideoReady}
              >
                <source src={currentItem.url} type="video/mp4" />
              </video>
            </motion.div>
          ) : (
            <motion.div
              key={`${currentItem.id}-${slideIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <motion.div
                className="absolute inset-0"
                animate={
                  reduceMotion
                    ? {}
                    : {
                        x: kbDir.x,
                        y: kbDir.y,
                        scale: kbDir.scale,
                      }
                }
                transition={{ duration: IMAGE_DURATION / 1000, ease: 'linear' }}
              >
                <Image
                  src={currentItem.url}
                  alt={currentItem.label}
                  fill
                  className="object-cover"
                  style={{ filter: 'brightness(0.45) saturate(1.2)' }}
                  sizes="100vw"
                  priority={slideIndex === 0}
                  quality={85}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-amber-950/10 to-transparent" />
      </div>

      {/* ── Slide indicators ── */}
      {mediaItems.length > 1 && (
        <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20 flex items-center gap-2">
          {mediaItems.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlideIndex(i); setVideoReady(false); }}
              aria-label={`Slide ${i + 1}`}
              className="group relative h-6 flex items-center cursor-pointer"
            >
              <div
                className="h-[2px] rounded-full transition-all duration-500 bg-white/20 group-hover:bg-white/40"
                style={{ width: i === slideIndex % mediaItems.length ? 28 : 8 }}
              />
              {i === slideIndex % mediaItems.length && (
                <motion.div
                  className="absolute left-0 h-[2px] rounded-full bg-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: 28 }}
                  transition={{
                    duration: (currentItem?.type === 'video' ? VIDEO_MIN_DURATION : IMAGE_DURATION) / 1000,
                    ease: 'linear',
                  }}
                  key={slideIndex}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 w-full pb-24 md:pb-32 pt-40">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="max-w-3xl">

            {/* Title */}
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="text-[2.5rem] leading-[0.9] md:text-6xl lg:text-7xl xl:text-[5.2rem] font-black text-white tracking-[-0.03em]"
              style={{ textShadow: '0 4px 40px rgba(0,0,0,0.5)' }}
            >
              {t('title1')}
              <br />
              <span className="relative block mt-1 md:mt-3 h-[1.1em]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={textIndex}
                    initial={reduceMotion ? false : { opacity: 0, y: 20, filter: 'blur(12px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -12, filter: 'blur(8px)' }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-0 whitespace-nowrap bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(251,191,36,0.3)]"
                  >
                    {rotatingTexts[textIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-base md:text-lg lg:text-xl text-white/75 mt-5 md:mt-7 max-w-lg leading-relaxed font-light"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
            >
              {t('subtitle')}
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 md:mt-10"
            >
              <Link
                href="/configurador"
                onClick={() => trackCTAClick('hero_configurator_primary', 'hero_elegant')}
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <div className="absolute -inset-2 bg-amber-500/25 rounded-3xl blur-2xl group-hover:bg-amber-500/35 transition-colors duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-[length:200%_100%] rounded-2xl animate-[shimmer_3s_ease-in-out_infinite]" />
                <span className="relative z-10 text-zinc-900 font-black text-base md:text-lg">
                  {t('ctaConfigurator')}
                </span>
                <svg className="relative z-10 w-5 h-5 text-zinc-900 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="flex items-center gap-5 mt-8 md:mt-10"
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white font-bold text-sm">{t('rating')}</span>
              </div>
              <span className="w-px h-3.5 bg-white/40" />
              <span className="text-white font-medium text-sm">{t('socialProof')}</span>
              <span className="w-px h-3.5 bg-white/40 hidden sm:block" />
              <span className="text-white font-medium text-sm hidden sm:block">{'<2h '}{t('responseLabel')}</span>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 2.5, duration: 0.8 }}
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
