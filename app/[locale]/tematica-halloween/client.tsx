'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  PUBLIC_HALLOWEEN_PACKS,
  PUBLIC_HALLOWEEN_FAQ_KEYS,
  PUBLIC_HALLOWEEN_INCLUDES_KEYS,
  PUBLIC_HALLOWEEN_HERO_TAGS,
  PUBLIC_HALLOWEEN_HERO_IMAGE,
  PUBLIC_HALLOWEEN_GALLERY_SELECTION,
  WHATSAPP_NUMBER,
} from '@/lib/constants';
import { PORTFOLIO_IMAGES } from '@/config/portfolio-images';
import { SITE_CONFIG } from '@/app/config/site-config';
import HalloweenAtmosphere from '@/app/components/ui/HalloweenAtmosphere';
import HalloweenDecorationSection from '@/app/components/ui/HalloweenDecorationSection';

// ═══════════════════════════════════════════════════════════════
// HALLOWEEN DIVIDER
// ═══════════════════════════════════════════════════════════════

function HalloweenDivider({ variant = 'orange' }: { variant?: 'orange' | 'red' }) {
  const color = variant === 'red' ? 'via-red-500/20' : 'via-orange-500/30';
  return <div className={`h-px bg-gradient-to-r from-transparent ${color} to-transparent`} />;
}

const HERO_LIGHTNING_EPISODES = [
  {
    delay: 0.24,
    duration: 7.2,
    pulses: [0.062],
    path: 'M16 0 L12 6 L15 11 L10 18 L13 24 L8 31 L11 37 L7 46 L10 55 L6 65 L9 76 L5 88 L7 100',
    branches: ['M15 11 L22 15 L17 21', 'M11 37 L3 42 L8 49'],
  },
  {
    delay: 4.05,
    duration: 8.6,
    pulses: [0.082, 0.128],
    path: 'M86 0 L81 7 L84 13 L78 20 L82 27 L76 34 L80 42 L74 50 L78 60 L72 71 L76 83 L70 94 L73 100',
    branches: ['M84 13 L92 17 L87 23', 'M80 42 L88 48 L83 55'],
  },
  {
    delay: 8.7,
    duration: 10.1,
    pulses: [0.076],
    path: 'M33 0 L29 7 L32 12 L27 19 L30 25 L24 33 L27 41 L22 50 L26 61 L21 72 L24 84 L20 94 L22 100',
    branches: ['M32 12 L39 16 L34 22', 'M27 41 L18 46 L23 54'],
  },
];

function buildLightningEpisodeKeyframes(pulses: number[], duration: number) {
  const boltOpacity: number[] = [0];
  const boltTimes: number[] = [0];
  const washOpacity: number[] = [0];
  const washTimes: number[] = [0];
  let lastBolt = 0;
  let lastWash = 0;

  for (const pulse of [...pulses].sort((a, b) => a - b)) {
    const boltStart = Math.max(lastBolt, pulse);
    const boltHold = Math.min(0.992, pulse + 0.4 / duration);
    const boltEnd = Math.min(0.996, pulse + 0.5 / duration);

    const washStart = Math.max(lastWash, Math.min(0.993, boltEnd + 0.015 / duration));
    const washPeak = Math.min(0.996, boltEnd + 0.055 / duration);
    const washTrail = Math.min(0.998, washPeak + 0.05 / duration);
    const washEnd = Math.min(0.999, boltEnd + 0.18 / duration);

    boltOpacity.push(0, 1, 0.9, 0);
    boltTimes.push(boltStart, boltStart, boltHold, boltEnd);
    washOpacity.push(0, 0.42, 0.08, 0);
    washTimes.push(washStart, washPeak, washTrail, washEnd);

    lastBolt = boltEnd;
    lastWash = washEnd;
  }

  if (boltTimes[boltTimes.length - 1] < 1) {
    boltOpacity.push(0);
    boltTimes.push(1);
  }

  if (washTimes[washTimes.length - 1] < 1) {
    washOpacity.push(0);
    washTimes.push(1);
  }

  return { boltOpacity, boltTimes, washOpacity, washTimes };
}

// ═══════════════════════════════════════════════════════════════
// MAIN CLIENT COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function HalloweenClient() {
  const t = useTranslations('halloweenPage');
  const tWhatsapp = useTranslations('whatsappMessages');
  const prefersReducedMotion = useReducedMotion();

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [heroStormOpacity, setHeroStormOpacity] = useState(1);
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);

  const halloweenGallery = PUBLIC_HALLOWEEN_GALLERY_SELECTION.map((src) =>
    (PORTFOLIO_IMAGES['fiestas-tematicas-halloween'] || []).find((image) => image.src === src)
  ).filter((image): image is NonNullable<(typeof PORTFOLIO_IMAGES)['fiestas-tematicas-halloween'][number]> => Boolean(image));
  const year = new Date().getFullYear();
  const heroTags = PUBLIC_HALLOWEEN_HERO_TAGS ?? [];
  const includeKeys = PUBLIC_HALLOWEEN_INCLUDES_KEYS ?? [];
  const faqKeys = PUBLIC_HALLOWEEN_FAQ_KEYS ?? [];
  const halloweenPacks = PUBLIC_HALLOWEEN_PACKS ?? [];
  const urgencyDatesRaw = t.raw('urgency.dates');
  const urgencyDates = Array.isArray(urgencyDatesRaw) ? urgencyDatesRaw : [];

  // Lightbox keyboard handler
  useEffect(() => {
    if (!lightboxSrc) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxSrc(null); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleEsc); document.body.style.overflow = ''; };
  }, [lightboxSrc]);

  useEffect(() => {
    const updateHeroScrollFx = () => {
      const viewportHeight = window.innerHeight || 1;
      const fadeDistance = viewportHeight * 1.34;
      const progress = Math.min(1, Math.max(0, window.scrollY / fadeDistance));
      setHeroScrollProgress(Number(progress.toFixed(3)));
      setHeroStormOpacity(Number((1 - progress).toFixed(3)));
    };

    updateHeroScrollFx();
    window.addEventListener('scroll', updateHeroScrollFx, { passive: true });
    window.addEventListener('resize', updateHeroScrollFx);

    return () => {
      window.removeEventListener('scroll', updateHeroScrollFx);
      window.removeEventListener('resize', updateHeroScrollFx);
    };
  }, []);

  const handlePackSelect = useCallback((key: string) => {
    setSelectedPack(prev => prev === key ? null : key);
  }, []);

  const sceneProgress = heroScrollProgress;
  const heroLayerProgress = Number(Math.min(1, Math.max(0, (sceneProgress - 0.24) / 0.5)).toFixed(3));
  const introLayerProgress = Number(Math.min(1, Math.max(0, (sceneProgress - 0.34) / 0.28)).toFixed(3));
  const heroSectionOpacity = Number(Math.max(0.08, 1 - heroLayerProgress * 0.92).toFixed(3));
  const heroSectionTranslateY = Number((heroLayerProgress * 104).toFixed(2));
  const heroSectionScale = Number((1 - heroLayerProgress * 0.05).toFixed(3));
  const heroSectionBlur = Number((heroLayerProgress * 7.5).toFixed(2));
  const heroContentOpacity = Number(Math.max(0.36, 1 - heroLayerProgress * 0.42).toFixed(3));
  const heroContentTranslateY = Number((heroLayerProgress * 34).toFixed(2));
  const heroContentScale = Number((1 - heroLayerProgress * 0.018).toFixed(3));
  const heroContentBlur = Number((heroLayerProgress * 1.8).toFixed(2));
  const firstSectionOpacity = Number(introLayerProgress.toFixed(3));
  const firstSectionTranslateY = Number(((1 - introLayerProgress) * 148).toFixed(2));
  const firstSectionScale = Number((0.965 + introLayerProgress * 0.035).toFixed(3));
  const firstSectionBlur = Number(((1 - introLayerProgress) * 10).toFixed(2));
  const firstSectionClipInset = Number(((1 - introLayerProgress) * 14).toFixed(2));

  return (
    <main className="relative overflow-hidden bg-[linear-gradient(180deg,#090909_0%,#120b08_26%,#12090d_58%,#060606_100%)] text-white">
      <HalloweenAtmosphere />

      {/* ═══ HERO ═══ */}
      <section
        className="relative min-h-[96svh] overflow-hidden"
        style={{
          touchAction: 'pan-y',
          opacity: heroSectionOpacity,
          transform: `translateY(${heroSectionTranslateY}px) scale(${heroSectionScale})`,
          filter: `blur(${heroSectionBlur}px)`,
          transformOrigin: 'center bottom',
        }}
      >
        <Image
          src={PUBLIC_HALLOWEEN_HERO_IMAGE}
          alt="Halloween immersiu Òrbita Events"
          fill
          sizes="100vw"
          quality={74}
          className="pointer-events-none object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,145,54,0.16),transparent_22%),radial-gradient(circle_at_80%_18%,rgba(239,68,68,0.14),transparent_24%),radial-gradient(circle_at_52%_62%,rgba(255,214,102,0.08),transparent_18%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-black/68 to-black/24" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090909]/72 via-transparent to-[#090909]/38" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_46%,rgba(0,0,0,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08)_0%,transparent_18%,transparent_56%,rgba(255,120,40,0.08)_74%,transparent_100%)] mix-blend-screen opacity-70" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#080808] via-[#080808]/92 to-transparent" />

        {!prefersReducedMotion ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
            animate={{ opacity: heroStormOpacity }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {HERO_LIGHTNING_EPISODES.map((episode, index) => {
              const fx = buildLightningEpisodeKeyframes(episode.pulses, episode.duration);
              return (
                <div key={index} className="absolute inset-0">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: fx.washOpacity }}
                    transition={{ duration: episode.duration, delay: episode.delay, repeat: Infinity, times: fx.washTimes }}
                    className="absolute inset-0 bg-white/90"
                  />
                  <motion.svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: fx.boltOpacity }}
                    transition={{ duration: episode.duration, delay: episode.delay, repeat: Infinity, times: fx.boltTimes }}
                    className="absolute inset-0 h-full w-full mix-blend-screen"
                  >
                    <path
                      d={episode.path}
                      fill="none"
                      stroke="rgba(255,237,160,0.24)"
                      strokeWidth="5.8"
                      strokeLinecap="round"
                      strokeLinejoin="miter"
                    />
                    <path
                      d={episode.path}
                      fill="none"
                      stroke="rgba(255,229,110,0.98)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="miter"
                    />
                    {episode.branches.map((branch, branchIndex) => (
                      <g key={branchIndex}>
                        <path
                          d={branch}
                          fill="none"
                          stroke="rgba(255,237,160,0.16)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="miter"
                        />
                        <path
                          d={branch}
                          fill="none"
                          stroke="rgba(255,229,110,0.9)"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="miter"
                        />
                      </g>
                    ))}
                  </motion.svg>
                </div>
              );
            })}
          </motion.div>
        ) : null}

        <div className="relative z-10 mx-auto flex min-h-[96svh] max-w-6xl flex-col justify-end px-4 pb-18 pt-24 sm:pb-20">
          <div
            style={{
              opacity: heroContentOpacity,
              transform: `translateY(${heroContentTranslateY}px) scale(${heroContentScale})`,
              filter: `blur(${heroContentBlur}px)`,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-2xl rounded-[34px] border border-white/12 bg-[linear-gradient(180deg,rgba(0,0,0,0.84),rgba(0,0,0,0.68))] px-5 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.26)] backdrop-blur-md sm:px-7 sm:py-8"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/14 px-4 py-1.5 text-sm text-orange-300 backdrop-blur-sm"
              >
                <span className="text-base">🎃</span>
                {t('badge', { year })}
              </motion.span>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-white/55 sm:text-sm"
              >
                {t('hero.kicker')}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="relative text-5xl font-black leading-[0.93] tracking-tight sm:text-7xl md:text-8xl"
              >
                <span className="block text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]">{t('hero.title1')}</span>
                <span className="block bg-gradient-to-r from-orange-200 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(249,115,22,0.22)]">
                  {t('hero.title2')}
                </span>
                <span className="pointer-events-none absolute inset-x-0 top-[58%] h-8 bg-[radial-gradient(circle,rgba(255,130,40,0.2)_0%,transparent_72%)] blur-xl" />
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 max-w-xl text-base leading-7 text-white/72 sm:text-xl"
              >
                {t('hero.subtitle')}
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-5 flex flex-wrap gap-2 text-xs text-white/62 sm:text-sm"
              >
                {heroTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/8 bg-black/40 px-3 py-1.5">
                    {t(`hero.tags.${tag}`)}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/contacto?tema=halloween"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/35"
                >
                  <span>👻</span> {t('cta.reserve')}
                </Link>
                <Link
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(tWhatsapp('halloween'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-black/20 px-7 py-4 text-base font-medium text-white transition-all hover:border-orange-500/35 hover:bg-black/30"
                >
                  <span>💬</span> {t('cta.whatsapp')}
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ QUICK INFO STRIP ═══ */}
      <div
        className="relative z-20 -mt-18 px-4 sm:-mt-24"
        style={{
          opacity: firstSectionOpacity,
          transform: `translateY(${firstSectionTranslateY}px) scale(${firstSectionScale})`,
          filter: `blur(${firstSectionBlur}px)`,
          clipPath: `inset(${firstSectionClipInset}% 0 0 0 round 36px)`,
        }}
      >
        <section className="relative mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,12,12,0.985),rgba(6,6,6,0.97))] px-5 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-md sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_16%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-orange-500/12 to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(249,115,22,0.08),transparent_22%),radial-gradient(circle_at_85%_50%,rgba(239,68,68,0.08),transparent_24%)]" />
          <div className="relative z-10 grid gap-4 md:grid-cols-3 md:items-stretch">
            <div className="flex h-full rounded-[26px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] px-5 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-xl">🎬</div>
                <div>
                  <p className="text-sm font-semibold text-orange-300">{t('gallery.title')} {t('gallery.titleHighlight')}</p>
                  <p className="mt-1 text-sm leading-6 text-white/62">{t('gallery.subtitle')}</p>
                </div>
              </div>
            </div>

            <div className="flex h-full rounded-[26px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] px-5 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)] transition-transform duration-300 hover:-translate-y-1 hover:border-orange-500/25">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-xl">🕯️</div>
                <div>
                  <p className="text-sm font-semibold text-orange-300">{t('includes.decoration.title')}</p>
                  <p className="mt-1 text-sm leading-6 text-white/62">{t('includes.intro')}</p>
                </div>
              </div>
            </div>

            <div className="flex h-full rounded-[26px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] px-5 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-xl">👻</div>
                <div>
                  <p className="text-sm font-semibold text-orange-300">{t('packs.night.name')}</p>
                  <p className="mt-1 text-sm leading-6 text-white/62">{t('packs.subtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ═══ DECORATION ═══ */}
      <HalloweenDecorationSection />

      <HalloweenDivider variant="red" />

      {/* ═══ GALLERY WITH LIGHTBOX ═══ */}
      <section className="relative px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.05),transparent_62%)]" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-14 max-w-3xl text-center"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">{t('sections.gallery')}</p>
            <h2 className="text-3xl font-bold md:text-4xl">
              {t('gallery.title')} <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{t('gallery.titleHighlight')}</span>
            </h2>
            <p className="mt-4 text-white/52">{t('gallery.subtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {halloweenGallery.slice(0, 12).map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setLightboxSrc(img.src)}
                className={
                  'group relative cursor-pointer overflow-hidden rounded-2xl ring-1 ring-white/6 transition-all duration-500 hover:-translate-y-1 hover:ring-orange-500/30 ' +
                  (i === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-[4/3]' : 'aspect-square')
                }
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes={i === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 50vw'}
                  quality={72}
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.3)_100%)]" />
                {i === 0 ? (
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <div className="max-w-md rounded-[20px] border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/80">{t('sections.gallery')}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{t('gallery.title')} {t('gallery.titleHighlight')}</p>
                      <p className="mt-1 text-sm leading-6 text-white/62">{img.alt}</p>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <HalloweenDivider />

      {/* ═══ INCLUDES (DJ, DECORATION, EFFECTS) ═══ */}
      <section className="relative px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-orange-950/10 via-transparent to-red-950/10" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-14 max-w-3xl text-center"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">{t('sections.includes')}</p>
            <h2 className="text-3xl font-bold md:text-4xl">
              {t('includes.title')} <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{t('includes.titleHighlight')}</span>
            </h2>
            <p className="mt-4 text-white/56">{t('includes.intro')}</p>
          </motion.div>

          <div className="grid gap-7 md:grid-cols-3 md:gap-8">
            {includeKeys.map((key, index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group overflow-hidden rounded-[28px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02] hover:shadow-[0_20px_46px_rgba(0,0,0,0.28)]"
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-3xl transition-transform group-hover:scale-110 group-hover:border-orange-400/30">
                  {key === 'dj' ? '🎵' : key === 'decoration' ? '🕯️' : '🌫️'}
                </div>
                <h3 className="mb-2 text-xl font-bold">{t(`includes.${key}.title`)}</h3>
                <p className="leading-relaxed text-white/56">{t(`includes.${key}.description`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <HalloweenDivider variant="red" />

      {/* ═══ PACKS ═══ */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.05),transparent_48%),radial-gradient(ellipse_at_bottom,rgba(127,29,29,0.16),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_14%,transparent_100%)]" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-14 max-w-3xl text-center"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">{t('sections.packs')}</p>
            <h2 className="text-3xl font-bold md:text-5xl">
              {t('packs.title')} <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">{t('packs.titleHighlight', { year })}</span>
            </h2>
            <p className="mt-4 text-white/58">{t('packs.subtitle')}</p>
          </motion.div>

          <div className="mb-12 rounded-[32px] border border-orange-500/14 bg-[linear-gradient(90deg,rgba(249,115,22,0.12),rgba(18,12,10,0.92),rgba(127,29,29,0.14))] px-6 py-5 text-center text-sm font-medium text-white/78 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            {t('packs.includesDecoration')}
          </div>

          <div className="grid gap-7 md:grid-cols-3">
            {halloweenPacks.map((pack, index) => {
              const packName = t(`packs.${pack.key}.name`);
              const packIncludes = t.raw(`packs.${pack.key}.includes`) as string[];
              const isSelected = selectedPack === pack.key;

              return (
                <motion.div
                  key={pack.key}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 }}
                  whileHover={{ y: -8, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handlePackSelect(pack.key)}
                  className={
                    'group relative cursor-pointer overflow-hidden rounded-[32px] border p-6 transition-all duration-300 ' +
                    (pack.popular
                      ? 'border-orange-500/38 bg-[linear-gradient(180deg,rgba(249,115,22,0.16),rgba(17,10,8,0.96))] shadow-[0_24px_72px_rgba(249,115,22,0.16)] hover:shadow-[0_28px_88px_rgba(249,115,22,0.2)]'
                      : isSelected
                        ? 'border-orange-500/28 bg-[linear-gradient(180deg,rgba(249,115,22,0.08),rgba(10,10,10,0.96))] shadow-[0_24px_64px_rgba(249,115,22,0.1)]'
                        : 'border-white/8 bg-[linear-gradient(180deg,rgba(24,16,14,0.88),rgba(8,8,8,0.98))] shadow-[0_24px_64px_rgba(0,0,0,0.28)] hover:border-orange-500/22 hover:shadow-[0_24px_70px_rgba(249,115,22,0.1)]')
                  }
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_36%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-orange-200/20 bg-gradient-to-r from-orange-500 via-orange-400 to-red-500 px-4 py-1 text-xs font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-orange-500/40">
                      {t('packs.mostRequested')}
                    </span>
                  )}

                  <div className="relative z-10">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl">{pack.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{packName}</h3>
                        <p className="mt-1 text-sm text-white/42">{pack.hours} {t('packs.hours')}</p>
                      </div>
                    </div>

                    <div className="mb-5 flex items-end gap-3">
                      <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-red-400 bg-clip-text text-5xl font-black text-transparent">{pack.price}€</span>
                    </div>

                    <div className="mb-5 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                    <ul className="space-y-2.5">
                      {packIncludes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/64">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/12">
                            <span className="text-xs text-orange-300">✦</span>
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/contacto?tema=halloween&pack=${encodeURIComponent(packName)}`}
                      onClick={(e) => e.stopPropagation()}
                      className={
                        'mt-7 block w-full rounded-full py-3 text-center font-bold transition-all ' +
                        (pack.popular
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/35'
                          : 'border border-white/15 text-white hover:border-orange-500/40 hover:bg-orange-500/5')
                      }
                    >
                      {t('cta.requestInfo')}
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>      <HalloweenDivider />

      {/* ═══ URGENCY — OCTOBER DATES ═══ */}
      <section className="relative px-4 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.04),transparent_50%)]" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-6 rounded-[28px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.98))] p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8"
          >
            <div className="text-center md:text-left">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">{t('sections.urgencyLabel')}</p>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">{t('urgency.title', { year })}</h2>
              <p className="mb-6 max-w-2xl text-white/56">{t('urgency.subtitle')}</p>

              <p className="mb-4 text-sm font-semibold text-orange-300">{t('urgency.octobrerDates')}</p>
              <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                {urgencyDates.map((date, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200"
                  >
                    {date}
                  </motion.span>
                ))}
              </div>
              <p className="mt-4 text-sm text-white/50">{t('urgency.warning')}</p>
            </div>

            <div className="rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(18,13,12,0.92),rgba(8,8,8,0.98))] p-6 text-center shadow-[0_18px_52px_rgba(0,0,0,0.24)] md:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">Halloween ready</p>
              <p className="mt-3 text-xl font-semibold text-white">{t('packs.includesDecoration')}</p>
              <p className="mt-3 text-sm leading-6 text-white/58">{t('finalCta.subtitle')}</p>
              <Link
                href="/contacto?tema=halloween"
                className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/35"
              >
                <span>🎃</span> {t('cta.reserve')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <HalloweenDivider variant="red" />

      {/* ═══ FAQ ACCORDION ═══ */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.04),transparent_54%)]" />
        <div className="relative z-10 mx-auto max-w-4xl overflow-hidden rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,12,11,0.94),rgba(7,7,7,0.985))] px-5 py-10 shadow-[0_28px_84px_rgba(0,0,0,0.26)] backdrop-blur-sm md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">{t('sections.faqLabel')}</p>
            <h2 className="text-3xl font-bold md:text-4xl">{t('faq.title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/56">{t('faq.subtitle')}</p>
          </motion.div>

          <div className="space-y-3">
            {faqKeys.map((faqKey, index) => (
              <motion.div
                key={faqKey}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`overflow-hidden rounded-[22px] border transition-all duration-300 ${
                  faqOpen === index
                    ? 'border-orange-500/16 bg-[linear-gradient(180deg,rgba(20,14,12,0.95),rgba(8,8,8,0.98))] shadow-[0_18px_40px_rgba(0,0,0,0.26)]'
                    : 'border-white/7 bg-black/40 hover:border-orange-500/18 hover:bg-orange-500/[0.02]'
                }`}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className={`font-medium text-[15px] transition-colors duration-200 ${
                    faqOpen === index ? 'text-orange-100' : 'text-white'
                  }`}>
                    {t(`faqs.${faqKey}.pregunta`)}
                  </span>
                  <motion.span
                    animate={{ rotate: faqOpen === index ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-xl transition-colors duration-200 ${
                      faqOpen === index ? 'border-orange-400/30 bg-orange-500/10 text-orange-300' : 'border-white/10 text-orange-500/50'
                    }`}
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence>
                  {faqOpen === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-5"
                    >
                      <p className="leading-relaxed text-sm text-white/70">
                        {t(`faqs.${faqKey}.resposta`)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>      <HalloweenDivider />

      {/* ═══ TESTIMONIAL ═══ */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.06),transparent_52%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 mx-auto max-w-4xl overflow-hidden rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,rgba(18,13,12,0.94),rgba(8,8,8,0.985))] px-6 py-12 text-center shadow-[0_30px_88px_rgba(0,0,0,0.28)] md:px-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.12),transparent_34%)]" />
          <div className="relative z-10">
            <div className="mb-6 text-6xl drop-shadow-[0_0_32px_rgba(249,115,22,0.26)]">🎃</div>
            <blockquote className="mx-auto max-w-3xl text-2xl font-medium italic leading-relaxed text-white/84 md:text-3xl">
              &ldquo;{t('testimonial.quote')}&rdquo;
            </blockquote>
            <div className="mx-auto my-6 h-px w-24 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
            <p className="text-white/40">— {t('testimonial.author')}</p>
          </div>
        </motion.div>
      </section>      <HalloweenDivider variant="red" />

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-orange-950/18 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1),transparent_54%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-white/6 bg-[linear-gradient(180deg,rgba(18,13,12,0.95),rgba(9,9,9,0.985))] px-6 py-12 text-center shadow-[0_32px_96px_rgba(0,0,0,0.28)] md:px-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_15%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-orange-500/14 to-transparent" />
          <div className="relative z-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300/80">{t('sections.close')}</p>
            <h2 className="mb-6 text-3xl font-black md:text-6xl">
              {t('finalCta.title1')}<br />
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent">{t('finalCta.title2')}</span>
            </h2>
            <p className="mx-auto max-w-2xl text-white/58">{t('finalCta.subtitle')}</p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contacto?tema=halloween"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/40"
              >
                <span>👻</span> {t('cta.reserve2025', { year })}
              </Link>
              <Link
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(tWhatsapp('halloween'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-4 font-semibold text-white transition-all hover:border-orange-500/40 hover:bg-white/5"
              >
                <span>💬</span> {t('cta.whatsapp')}
              </Link>
            </div>

            <div className="mx-auto mt-8 h-px w-28 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
            <p className="mt-8 text-sm text-white/48">{t('finalCta.footer')}</p>
          </div>
        </motion.div>
      </section>      {/* ═══ SCHEMA.ORG ═══ */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: t('schema.name'),
            description: t('schema.description'),
            provider: { '@type': 'Organization', name: SITE_CONFIG.business.name },
            areaServed: { '@type': 'Place', name: 'Barcelona, Girona' },
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: String(Math.min(...halloweenPacks.map(p => p.price))),
              highPrice: String(Math.max(...halloweenPacks.map(p => p.price))),
              priceCurrency: 'EUR',
            },
          }),
        }}
      />

      {/* ═══ LIGHTBOX ═══ */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/95 p-4"
            onClick={() => setLightboxSrc(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative h-full max-h-[90vh] w-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightboxSrc}
                alt=""
                fill
                sizes="100vw"
                quality={90}
                className="object-contain"
              />
              <button
                onClick={() => setLightboxSrc(null)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-2xl font-light text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                aria-label={t('lightbox.close')}
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
































































































