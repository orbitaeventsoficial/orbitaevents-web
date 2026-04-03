'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { PUBLIC_HERO_MEDIA_FALLBACK, WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';
import { trackCTAClick, trackWhatsAppClick } from '@/app/lib/analytics';

type HeroMediaItem = (typeof PUBLIC_HERO_MEDIA_FALLBACK)[number];

const IMAGE_DURATION = 8500;
const VIDEO_MIN_DURATION = 12000;

function shuffle<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

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
    <span className="relative mt-1 block min-h-[2.3em] text-[clamp(2.1rem,10vw,3rem)] leading-[0.95] text-amber-400">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent"
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
  const tCommon = useTranslations('common');
  const reduceMotion = useReducedMotion();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<HeroMediaItem[]>([...PUBLIC_HERO_MEDIA_FALLBACK]);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    fetch('/api/hero-media')
      .then((r) => r.json())
      .then((data: HeroMediaItem[]) => {
        if (Array.isArray(data) && data.length > 0) setMediaItems(shuffle(data));
      })
      .catch(() => {});
  }, []);

  const currentItem = mediaItems[slideIndex % mediaItems.length];

  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const duration = currentItem?.type === 'video' ? VIDEO_MIN_DURATION : IMAGE_DURATION;
    const timer = window.setTimeout(() => {
      setSlideIndex((prev) => (prev + 1) % mediaItems.length);
      setVideoReady(false);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [currentItem?.type, mediaItems.length, slideIndex]);

  const handleVideoReady = useCallback(() => {
    window.setTimeout(() => setVideoReady(true), 120);
  }, []);

  return (
    <section
      aria-label="Hero"
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050505 0%, #100d0a 42%, #090909 100%)' }}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/46 via-transparent to-black/72" />
        <AnimatePresence>
          {currentItem.type === 'video' ? (
            <motion.div
              key={`${currentItem.id}-${slideIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <video
                key={currentItem.url}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
                style={{ opacity: videoReady ? 1 : 0, transition: 'opacity 0.45s ease', filter: 'brightness(0.6) saturate(0.94)' }}
                onCanPlay={handleVideoReady}
              >
                <source src={currentItem.url} type="video/mp4" />
              </video>
            </motion.div>
          ) : (
            <motion.div
              key={`${currentItem.id}-${slideIndex}`}
              initial={{ opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <Image
                src={currentItem.url}
                alt={currentItem.label}
                fill
                priority={slideIndex === 0}
                sizes="100vw"
                quality={72}
                className="object-cover"
                style={{ filter: 'brightness(0.6) saturate(0.94)' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.1),transparent_42%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-end px-5 pb-12 pt-20">
        <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-black/24 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.34)] backdrop-blur-md">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }}
            className="mb-3 flex flex-wrap items-center gap-2"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {t('badges.halloween', { year: currentYear })}
            </span>
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">{t('socialProof')}</span>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.38, delay: 0.05 }}
            className="text-[clamp(1.9rem,9vw,2.8rem)] font-black leading-[0.94] text-white"
          >
            {t('title')}
            <MorphingText />
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.12 }}
            className="mt-3 max-w-sm text-[15px] leading-6 text-white/72"
          >
            {t('subtitle')}
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.34, delay: 0.18 }}
            className="mt-5 grid gap-3"
          >
            <a
              href={WHATSAPP_URL_WITH_MESSAGE(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackWhatsAppClick('mobile_hero');
                trackCTAClick('mobile_hero_whatsapp_primary', 'mobile_hero');
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 px-5 py-3.5 text-sm font-black text-black shadow-[0_12px_32px_rgba(251,191,36,0.24)]"
            >
              <span>{tCommon('buttons.whatsapp')}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/${locale}/packs`}
                onClick={() => trackCTAClick('mobile_hero_packs_secondary', 'mobile_hero')}
                className="flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white/86"
              >
                {t('ctaPacks')}
              </Link>
              <Link
                href={`/${locale}/configurador`}
                onClick={() => trackCTAClick('mobile_hero_configurator_secondary', 'mobile_hero')}
                className="flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/70"
              >
                {tCommon('buttons.requestQuoteFree')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.28, delay: 0.28 }}
            className="mt-4 flex flex-wrap gap-2 text-[12px] text-white/62"
          >
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{t('location')}</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">{t('socialProof')}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

