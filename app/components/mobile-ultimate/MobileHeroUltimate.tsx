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
import { PUBLIC_HERO_MEDIA_FALLBACK, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

// ── Media items (mateixos que desktop) ──────────────────────────────────────

type HeroMediaItem = (typeof PUBLIC_HERO_MEDIA_FALLBACK)[number];


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
    <span className="relative block h-[3em] mt-1">
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-2xl blur-xl opacity-50" />
        <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl font-black text-black text-sm shadow-2xl">
          <span>{t('buttons.whatsapp')}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </motion.a>

      {/* Secondary CTA - Preus */}
      <motion.a
        href={`/${locale}/packs`}
        whileTap={{ scale: 0.96 }}
        onTapStart={() => haptic('light')}
        onClick={() => trackCTAClick('mobile_hero_packs_secondary', 'mobile_hero')}
        className="flex items-center justify-center gap-2.5 py-3.5 px-5 bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/15 font-bold text-white text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
      >
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{tHero('ctaPacks')}</span>
      </motion.a>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function MobileHeroUltimate() {
  const t = useTranslations('mobileHero');
  const reduceMotion = useReducedMotion();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<HeroMediaItem[]>([...PUBLIC_HERO_MEDIA_FALLBACK]);
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
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ touchAction: 'pan-y', background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a1008 40%, #12100a 70%, #0a0a0a 100%)' }}
    >
      {/* ── Background: poster + slides ── */}
      <div className="absolute inset-0">
        {/* Poster — warm gradient visible immediatament mentre carrega media */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-amber-950/20 to-black" />

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
                preload="auto"
                disableRemotePlayback disablePictureInPicture
                className="w-full h-full object-cover"
                style={{
                  opacity: videoReady ? 1 : 0,
                  transition: 'opacity 0.8s ease',
                  filter: 'brightness(0.55) saturate(1.15)',
                }}
                onCanPlay={handleVideoReady}
              >
                <source src={currentItem.url} type="video/mp4" />
              </video>
            </motion.div>
          ) : (
            <motion.div
              key={`${currentItem.id}-${slideIndex}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <Image
                src={currentItem.url}
                alt={currentItem.label}
                fill
                className="object-cover"
                style={{ filter: 'brightness(0.55) saturate(1.15)' }}
                sizes="100vw"
                priority={slideIndex === 0}
                quality={85}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlays — cinematogràfics */}
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black via-black/80 to-transparent" />
        {/* Vinyeta lateral subtil */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)' }} />
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
        className="relative z-10 h-full flex flex-col items-center justify-center pb-14 text-center"
        style={{ paddingTop: 'calc(var(--header-height, 64px) + 1rem)' }}
      >
        <div className="w-full max-w-md px-6 mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mb-3"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/10 text-white/70 text-xs font-medium tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {t('badges.halloween', { year: currentYear })}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2.2rem,10vw,2.8rem)] leading-[1.05] font-black text-white mb-3"
            style={{ textShadow: '0 4px 30px rgba(0,0,0,0.7)' }}
          >
            {t('title')}
            <MorphingText />
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="text-base text-white/75 mb-4 max-w-xs mx-auto font-light"
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
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/10">
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
