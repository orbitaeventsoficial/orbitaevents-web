'use client';

/**
 * MOBILE HERO ULTIMATE - Òrbita Events
 * Hero mòbil amb carrousel d'imatges + video, optimitzat per fluïdesa
 */

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useMobile } from './MobileAppShell';
import { useTranslations } from 'next-intl';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

// ── Media items (mateixos que desktop) ──────────────────────────────────────

interface HeroMediaItem {
  id: string;
  url: string;
  type: 'video' | 'image';
  label: string;
}

const FALLBACK: HeroMediaItem[] = [
  { id: 'video-original', url: '/videos/hero-orbita-mobile.mp4', type: 'video', label: 'Vídeo' },
  { id: 'img-disco-01', url: '/img/portfolio/discomovil/discomovil-01.avif', type: 'image', label: 'Discomòbil' },
  { id: 'img-bodas-04', url: '/img/portfolio/bodas/bodas-04.avif', type: 'image', label: 'Bodes' },
  { id: 'img-halloween-01', url: '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif', type: 'image', label: 'Halloween' },
  { id: 'img-magic-05', url: '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif', type: 'image', label: 'Món Màgic' },
  { id: 'img-empresa-01', url: '/img/portfolio/eventos-empresa/eventos-empresa-01.avif', type: 'image', label: 'Empreses' },
];

const IMAGE_DURATION = 6000;
const VIDEO_MIN_DURATION = 10000;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Morphing text ───────────────────────────────────────────────────────────

function MorphingText() {
  const t = useTranslations('mobileHero');
  const texts = useMemo(() => {
    const extended = t.raw('morphingTextsExtended') as string[] | undefined;
    if (Array.isArray(extended) && extended.length > 0) return extended;
    return [
      t('morphingTexts.unique'),
      t('morphingTexts.magical'),
      t('morphingTexts.brutal'),
      t('morphingTexts.yours'),
    ];
  }, [t]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!texts.length) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span className="relative block h-[1.15em] mt-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 right-0 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent font-black"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ── Scroll indicator ────────────────────────────────────────────────────────

function ScrollIndicator() {
  const { haptic, scrollToSection } = useMobile();
  const t = useTranslations('mobileHero');

  return (
    <button
      onClick={() => { haptic('light'); scrollToSection('services-section'); }}
      aria-label={t('scroll')}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50"
    >
      <span className="text-white/60 text-[10px] font-medium tracking-wider uppercase">{t('scroll')}</span>
      <div className="w-5 h-8 rounded-full border border-white/25 flex justify-center pt-1.5">
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1 h-1.5 rounded-full bg-amber-400/80"
        />
      </div>
    </button>
  );
}

// ── Floating CTAs ───────────────────────────────────────────────────────────

function FloatingCTAs() {
  const { haptic, locale } = useMobile();
  const t = useTranslations('common');
  const tHero = useTranslations('mobileHero');

  return (
    <div className="flex flex-col gap-3 w-full px-5">
      {/* Primary CTA - WhatsApp */}
      <motion.a
        href={WHATSAPP_URL_WITH_MESSAGE(tHero('whatsappMessage'))}
        target="_blank"
        rel="noopener noreferrer"
        whileTap={{ scale: 0.96 }}
        onTapStart={() => haptic('medium')}
        onClick={() => { trackWhatsAppClick('mobile_hero'); trackCTAClick('mobile_hero_whatsapp_primary', 'mobile_hero'); }}
        className="relative w-full overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl blur-xl opacity-50" />
        <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl font-black text-black text-sm shadow-2xl">
          <span>{t('buttons.whatsapp')}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </motion.a>

      {/* Secondary CTA - Configurador */}
      <motion.a
        href={`/${locale}/configurador`}
        whileTap={{ scale: 0.96 }}
        onTapStart={() => haptic('light')}
        onClick={() => trackCTAClick('mobile_hero_configurator_secondary', 'mobile_hero')}
        className="flex items-center justify-center gap-2.5 py-3.5 px-5 bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/15 font-bold text-white text-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>{t('buttons.requestQuote')}</span>
      </motion.a>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function MobileHeroUltimate() {
  const t = useTranslations('mobileHero');
  const reduceMotion = useReducedMotion();
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<HeroMediaItem[]>(FALLBACK);
  const [videoReady, setVideoReady] = useState(false);

  // Fetch media from API
  useEffect(() => {
    fetch('/api/hero-media')
      .then((r) => r.json())
      .then((data: HeroMediaItem[]) => {
        if (data.length > 0) setMediaItems(shuffle(data));
      })
      .catch(() => {});
  }, []);

  const currentItem = mediaItems[slideIndex % mediaItems.length];

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
      className="relative h-[100dvh] w-full overflow-hidden bg-black"
      style={{ touchAction: 'pan-y' }}
    >
      {/* ── Background: poster + slides ── */}
      <div className="absolute inset-0">
        {/* Poster — logo mentre carrega */}
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/orbitalockupwhite.svg" alt="Òrbita Events" className="w-36 h-36 opacity-25" />
        </div>

        {/* Slides — crossfade */}
        <AnimatePresence>
          {currentItem.type === 'video' ? (
            <motion.div
              key={`${currentItem.id}-${slideIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <video
                key={currentItem.url}
                autoPlay muted loop playsInline
                preload="metadata"
                disableRemotePlayback disablePictureInPicture
                className="w-full h-full object-cover"
                style={{
                  opacity: videoReady ? 1 : 0,
                  transition: 'opacity 0.8s ease',
                  filter: 'brightness(0.6) saturate(1.1)',
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
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <Image
                src={currentItem.url}
                alt={currentItem.label}
                fill
                className="object-cover"
                style={{ filter: 'brightness(0.6) saturate(1.1)' }}
                sizes="100vw"
                priority={slideIndex === 0}
                quality={85}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlays */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* ── Slide indicators ── */}
      {mediaItems.length > 1 && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
          {mediaItems.map((_, i) => (
            <button
              key={i}
              onClick={() => { setSlideIndex(i); setVideoReady(false); }}
              aria-label={`Slide ${i + 1}`}
              className="h-6 flex items-center"
            >
              <div
                className="h-[2px] rounded-full transition-all duration-300"
                style={{
                  width: i === slideIndex % mediaItems.length ? 20 : 6,
                  backgroundColor: i === slideIndex % mediaItems.length ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.25)',
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <div
        className="relative z-10 h-full flex flex-col items-center justify-center pb-20 text-center"
        style={{ paddingTop: 'calc(var(--header-height, 64px) + 1rem)' }}
      >
        <div className="w-full max-w-md px-6 mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-5"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-white/70 text-xs font-medium tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {t('badges.halloween', { year: new Date().getFullYear() })}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2.2rem,10vw,2.8rem)] leading-[1.05] font-black text-white mb-5"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
          >
            {t('title')}
            <MorphingText />
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-base text-white/75 mb-6 max-w-xs mx-auto font-light"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
          >
            {t('subtitle')}
          </motion.p>

          {/* CTAs */}
          <FloatingCTAs />

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-5"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/10">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-white font-bold text-sm">5.0</span>
              <span className="text-white/50 text-xs">{t('socialProof')}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      {!reduceMotion && <ScrollIndicator />}
    </section>
  );
}
