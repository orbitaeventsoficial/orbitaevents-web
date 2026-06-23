'use client';

import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { PUBLIC_HERO_MEDIA_FALLBACK, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';
import WhatsAppIcon from '@/app/components/public/WhatsAppIcon';
import { fetchHeroMedia, type HeroMediaItem } from '@/lib/api/heroMediaClient';
import { shuffle } from '@/lib/utils/shuffle';

const IMAGE_DURATION = 8500;

const HERO_PARTICLES = [
  { x: 8, y: 18, size: 2.5, delay: 0, dur: 7 },
  { x: 22, y: 34, size: 1.8, delay: 0.8, dur: 9 },
  { x: 34, y: 12, size: 2.2, delay: 2.1, dur: 8 },
  { x: 48, y: 28, size: 1.5, delay: 0.3, dur: 10 },
  { x: 62, y: 16, size: 2.8, delay: 1.6, dur: 7.5 },
  { x: 76, y: 32, size: 1.8, delay: 2.4, dur: 8.5 },
  { x: 88, y: 22, size: 2, delay: 0.6, dur: 9.5 },
  { x: 14, y: 52, size: 1.6, delay: 1.3, dur: 7.2 },
  { x: 38, y: 62, size: 2.1, delay: 0.1, dur: 8.3 },
  { x: 58, y: 48, size: 1.7, delay: 2.2, dur: 9.1 },
  { x: 72, y: 58, size: 2.4, delay: 0.9, dur: 7.8 },
  { x: 90, y: 46, size: 1.9, delay: 1.8, dur: 8.6 },
  { x: 28, y: 72, size: 1.5, delay: 0.4, dur: 9.3 },
  { x: 68, y: 68, size: 2, delay: 1.5, dur: 7.6 },
];

function MorphingText() {
  const t = useTranslations('mobileHero');
  const texts = useMemo(() => {
    const extended = t.raw('morphingTextsExtended') as string[] | undefined;
    if (Array.isArray(extended) && extended.length > 0) return extended;
    return [t('morphingTexts.unique')];
  }, [t]);
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (texts.length < 2 || reduceMotion) return;
    const timer = window.setInterval(() => setIndex((prev) => (prev + 1) % texts.length), 4600);
    return () => window.clearInterval(timer);
  }, [texts, reduceMotion]);

  return (
    <span
      className="mt-1 block min-h-[2.2em] text-[clamp(2.4rem,10.5vw,3.4rem)] leading-[0.96] tracking-[-0.03em]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="block text-amber-300"
          style={{ textShadow: '0 2px 12px rgba(251,191,36,0.5), 0 4px 24px rgba(0,0,0,0.8)' }}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default function MobileHeroUltimate() {
  const locale = useLocale();
  const t = useTranslations('mobileHero');
  const taglineMain = t('tagline.main');
  const taglineSecondary = t('tagline.secondary');
  const taglineEverywhere = t('tagline.everywhere');
  const tCommon = useTranslations('common');
  const reduceMotion = useReducedMotion();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const imageFallbackItems = useMemo(
    () => PUBLIC_HERO_MEDIA_FALLBACK.filter((item) => item.type === 'image'),
    []
  );
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<HeroMediaItem[]>(imageFallbackItems);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    fetchHeroMedia()
      .then((data) => {
        const mobileSafeItems = Array.isArray(data)
          ? data.filter(
              (item): item is HeroMediaItem =>
                item?.type === 'image' && typeof item?.url === 'string' && item.url.trim().length > 0
            )
          : [];
        if (mobileSafeItems.length > 0) {
          setMediaItems(shuffle(mobileSafeItems));
        }
      })
      .catch(() => {});
  }, []);

  const currentItem = mediaItems[slideIndex % Math.max(mediaItems.length, 1)] || imageFallbackItems[0];

  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const timer = window.setTimeout(() => {
      setSlideIndex((prev) => (prev + 1) % mediaItems.length);
    }, IMAGE_DURATION);
    return () => window.clearTimeout(timer);
  }, [mediaItems.length, slideIndex]);

  useEffect(() => {
    setImageLoaded(false);
  }, [currentItem?.url]);

  const handleImageLoaded = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    if (mediaItems.length <= 1) {
      setMediaItems(imageFallbackItems);
      return;
    }
    setSlideIndex((prev) => (prev + 1) % mediaItems.length);
  }, [imageFallbackItems, mediaItems.length]);

  const touchStateRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStateRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStateRef.current;
      touchStateRef.current = null;
      if (!start) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const dt = Date.now() - start.t;
      if (Math.abs(dx) < 50) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dt > 900) return;
      if (mediaItems.length < 2) return;
      setSlideIndex((prev) =>
        dx < 0 ? (prev + 1) % mediaItems.length : (prev - 1 + mediaItems.length) % mediaItems.length
      );
    },
    [mediaItems.length]
  );

  return (
    <section
      aria-label="Hero"
      className="relative min-h-[100svh] w-full overflow-hidden touch-pan-y oe-film-grain"
      style={{ background: 'linear-gradient(180deg, #010101 0%, #070606 34%, #040404 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentItem.id}-${slideIndex}`}
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: imageLoaded ? 1 : 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Image
              src={currentItem.url}
              alt={currentItem.label}
              fill
              priority
              unoptimized
              sizes="100vw"
              quality={72}
              className="object-cover"
              style={{ filter: 'brightness(0.92) saturate(1)', objectPosition: 'center center' }}
              onLoad={handleImageLoaded}
              onError={handleImageError}
            />
          </motion.div>
        </AnimatePresence>

        {!imageLoaded && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,153,0.14),transparent_32%),linear-gradient(180deg,rgba(28,24,24,0.92),rgba(8,8,8,0.78))]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[56%] bg-gradient-to-t from-black/95 via-black/70 to-transparent" />

        {!reduceMotion && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
            {HERO_PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full bg-amber-200/50"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  boxShadow: '0 0 6px rgba(253, 224, 164, 0.6)',
                }}
                animate={{
                  y: [0, -14, 0],
                  opacity: [0.25, 0.7, 0.25],
                }}
                transition={{
                  duration: p.dur,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        {mediaItems.length > 1 && (
          <div className="absolute top-14 left-1/2 z-20 flex -translate-x-1/2 gap-1">
            {mediaItems.slice(0, Math.min(mediaItems.length, 6)).map((_, i) => (
              <div
                key={i}
                className={`h-[2px] rounded-full transition-all duration-500 ${
                  i === slideIndex % mediaItems.length ? 'w-5 bg-white/70' : 'w-1.5 bg-white/28'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-end px-6 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="relative mx-auto w-full max-w-[25rem]">

          {/* Badges */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.32 }}
            className="mb-3 flex flex-wrap items-center gap-2.5"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              {t('badges.halloween', { year: currentYear })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-3.5 py-2 text-[12px] font-semibold text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md">
              <span className="text-amber-400">★</span> {t('socialProof')}
            </span>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.38, delay: 0.08 }}
            className="text-center space-y-1 uppercase tracking-[0.4em] text-white/70"
          >
            <p className="text-[0.55rem] text-white/60">{taglineMain}</p>
            <p className="text-[1rem] font-black tracking-[0.3em] text-white">{taglineSecondary}</p>
            <p className="text-[0.65rem] text-amber-300">{taglineEverywhere}</p>
          </motion.div>

          {/* Title + morphing */}
          <div className="relative">
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.42, delay: 0.06 }}
              className="relative z-10 text-[clamp(2.4rem,10.5vw,3.4rem)] font-black leading-[0.96] tracking-[-0.03em] text-white"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8), 0 4px 32px rgba(0,0,0,0.6)' }}
            >
              {t('title')}
              <MorphingText />
            </motion.h1>
          </div>

          {/* Subtitle + location */}
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.14 }}
            className="mt-3 text-[15px] leading-[1.4] text-white/80"
          >
            {t('subtitle')} <span className="text-white/55">📍 {t('location')}</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.36, delay: 0.22 }}
            className="mt-5 space-y-2.5"
          >
            <a
              href={WHATSAPP_URL_WITH_MESSAGE(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackWhatsAppClick('mobile_hero');
                trackCTAClick('mobile_hero_whatsapp_primary', 'mobile_hero');
              }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 px-7 py-3.5 text-[17px] font-black text-black shadow-[0_12px_32px_rgba(251,191,36,0.35),0_0_0_1px_rgba(251,191,36,0.15)] active:scale-[0.97] transition-transform"
            >
              <WhatsAppIcon className="h-5 w-5 flex-shrink-0" />
              <span>{tCommon('buttons.whatsapp')}</span>
            </a>

            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/packs`}
                onClick={() => trackCTAClick('mobile_hero_packs_secondary', 'mobile_hero')}
                className="flex flex-1 items-center justify-center rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-[13px] font-semibold text-white/80 backdrop-blur-sm active:scale-[0.98] transition-transform"
              >
                {t('ctaPacks')}
              </Link>
              <Link
                href={`/${locale}/configurador`}
                onClick={() => trackCTAClick('mobile_hero_configurator_secondary', 'mobile_hero')}
                className="flex flex-1 items-center justify-center rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-[13px] font-semibold text-white/80 backdrop-blur-sm active:scale-[0.98] transition-transform"
              >
                {tCommon('buttons.requestQuoteFree')}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}










































