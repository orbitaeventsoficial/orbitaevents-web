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
    <span className="relative mt-2 block min-h-[2.15em] text-[clamp(1.72rem,8.1vw,2.42rem)] leading-[1.01] text-amber-200">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bg-gradient-to-r from-amber-100 via-amber-300 to-orange-200 bg-clip-text text-transparent"
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
  const imageFallbackItems = useMemo(
    () => PUBLIC_HERO_MEDIA_FALLBACK.filter((item) => item.type === 'image'),
    []
  );
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaItems, setMediaItems] = useState<HeroMediaItem[]>(imageFallbackItems);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/hero-media')
      .then((r) => r.json())
      .then((data: HeroMediaItem[]) => {
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

  return (
    <section
      aria-label="Hero"
      className="relative min-h-[100svh] w-full overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #010101 0%, #070606 34%, #040404 100%)' }}
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
              quality={70}
              className="object-cover"
              style={{ filter: 'brightness(0.84) saturate(0.98)', objectPosition: 'center center' }}
              onLoad={handleImageLoaded}
              onError={handleImageError}
            />
          </motion.div>
        </AnimatePresence>

        {!imageLoaded && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,214,153,0.14),transparent_32%),linear-gradient(180deg,rgba(28,24,24,0.92),rgba(8,8,8,0.78))]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/24 via-black/6 to-black/42" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_14%,rgba(251,191,36,0.09),transparent_28%),radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_42%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-black/60 via-black/18 to-transparent" />

        {mediaItems.length > 1 && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex gap-1">
            {mediaItems.slice(0, Math.min(mediaItems.length, 6)).map((_, i) => (
              <div
                key={i}
                className={`h-[2px] rounded-full transition-all duration-500 ${
                  i === slideIndex % mediaItems.length ? 'w-5 bg-white/60' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 flex min-h-[100svh] items-end px-5 pb-8 pt-28">
        <div className="relative mx-auto w-full max-w-md rounded-[32px] border border-white/[0.14] bg-[linear-gradient(180deg,rgba(10,10,10,0.14),rgba(10,10,10,0.06))] px-4 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-[5px]">
          <div className="absolute inset-x-6 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }}
            className="mb-4 flex flex-wrap items-center gap-2"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/78">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {t('badges.halloween', { year: currentYear })}
            </span>
            <span className="rounded-full border border-white/12 bg-black/14 px-3 py-1 text-[10px] font-semibold text-white/82">
              {t('socialProof')}
            </span>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.38, delay: 0.05 }}
            className="text-[clamp(1.78rem,8.1vw,2.48rem)] font-black leading-[1.01] tracking-[-0.03em] text-white"
          >
            {t('title')}
            <MorphingText />
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3, delay: 0.12 }}
            className="mt-4 max-w-[28ch] text-[13px] leading-[1.7] text-white/84"
          >
            {t('subtitle')}
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.34, delay: 0.18 }}
            className="mt-6 grid gap-2.5"
          >
            <a
              href={WHATSAPP_URL_WITH_MESSAGE(t('whatsappMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackWhatsAppClick('mobile_hero');
                trackCTAClick('mobile_hero_whatsapp_primary', 'mobile_hero');
              }}
              className="flex items-center justify-center gap-2 rounded-[1.2rem] bg-gradient-to-r from-amber-200 via-amber-400 to-orange-300 px-5 py-3.5 text-sm font-black text-black shadow-[0_12px_32px_rgba(251,191,36,0.22)] active:scale-[0.97] transition-transform"
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>{tCommon('buttons.whatsapp')}</span>
            </a>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href={`/${locale}/packs`}
                onClick={() => trackCTAClick('mobile_hero_packs_secondary', 'mobile_hero')}
                className="flex items-center justify-center rounded-[1.1rem] border border-white/[0.16] bg-black/14 px-4 py-2.75 text-sm font-bold text-white active:scale-[0.97] transition-transform"
              >
                {t('ctaPacks')}
              </Link>
              <Link
                href={`/${locale}/configurador`}
                onClick={() => trackCTAClick('mobile_hero_configurator_secondary', 'mobile_hero')}
                className="flex items-center justify-center rounded-[1.1rem] border border-white/[0.14] bg-black/10 px-4 py-2.75 text-sm font-semibold text-white/88 active:scale-[0.97] transition-transform"
              >
                {tCommon('buttons.requestQuoteFree')}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.28, delay: 0.28 }}
            className="mt-5 flex items-center gap-2 text-[11px] text-white/72"
          >
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-black/12 px-3 py-1.5">
              <span className="text-[10px]">📍</span> {t('location')}
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
