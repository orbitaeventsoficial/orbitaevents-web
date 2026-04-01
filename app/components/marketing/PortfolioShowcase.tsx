'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO SHOWCASE — Cinematic horizontal scroll with event stories
// ═══════════════════════════════════════════════════════════════════════════

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState, useCallback, useEffect } from 'react';
import { PUBLIC_PORTFOLIO_SHOWCASE_ITEMS, getPublicPortfolioShowcasePhotos } from '@/lib/constants';

type EventStory = (typeof PUBLIC_PORTFOLIO_SHOWCASE_ITEMS)[number];
const EVENT_STORIES = PUBLIC_PORTFOLIO_SHOWCASE_ITEMS.filter((item) => item.showInDesktop);

// ─── Story Card ────────────────────────────────────────────────────────────

function StoryCard({
  story,
  t,
  reduceMotion,
  index,
}: {
  story: EventStory;
  t: ReturnType<typeof useTranslations>;
  reduceMotion: boolean | null;
  index: number;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const photos = getPublicPortfolioShowcasePhotos(story.slug, story.desktopPhotoCount);

  // Auto-rotate photos every 3s always
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setPhotoIdx((prev) => (prev + 1) % photos.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [photos.length, reduceMotion]);

  const categoryName = t(`categories.${story.translationKey}`);

  return (
    <motion.div
      ref={cardRef}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setPhotoIdx(0); }}
      className="relative flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[50vw] lg:w-[38vw] xl:w-[32vw]"
    >
      <Link
        href={`/portfolio/${story.slug}`}
        className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_32px_100px_rgba(0,0,0,0.4),0_0_60px_rgba(245,158,11,0.06)]"
      >
        {/* Photos with crossfade — totes apilades, opacity transition */}
        <div className="relative h-[28rem] md:h-[32rem] overflow-hidden">
          {photos.map((photo, i) => (
            <Image
              key={photo}
              src={photo}
              alt={`${categoryName} - Orbita Events`}
              fill
              sizes="(max-width: 768px) 85vw, (max-width: 1024px) 50vw, 32vw"
              className="object-cover transition-all duration-[1.5s] ease-in-out group-hover:scale-110"
              style={{ opacity: i === photoIdx ? 1 : 0, visibility: i === photoIdx ? 'visible' : 'hidden' }}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          ))}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className={`absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 bg-gradient-to-t ${story.desktopAccent}`} />

          {/* Photo dots indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            {photos.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setPhotoIdx(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === photoIdx % 5
                    ? 'bg-white w-5 shadow-[0_0_6px_rgba(255,255,255,0.4)]'
                    : 'bg-white/40 w-1.5 hover:bg-white/60'
                }`}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
            {photos.length > 5 && (
              <span className="text-white/50 text-xs ml-1">+{photos.length - 5}</span>
            )}
          </div>

          {/* Story content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            {/* Category badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em]">
                {categoryName}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-white text-2xl md:text-3xl font-black leading-tight mb-2">
              {t(`stories.${story.translationKey}.title`)}
            </h3>

            {/* Description */}
            <p className="text-white/60 text-sm leading-relaxed line-clamp-2 mb-4">
              {t(`stories.${story.translationKey}.desc`)}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/80 font-medium">
                {photos.length} fotos
              </span>
              <span className="text-white/20">·</span>
              <span className="inline-flex items-center gap-1.5 text-amber-400/80 font-medium group-hover:text-amber-400 transition-colors">
                {t('viewStory')}
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Scroll Buttons ────────────────────────────────────────────────────────

function ScrollButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Anterior' : 'Següent'}
      className={`hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed ${
        direction === 'left' ? 'mr-3' : 'ml-3'
      }`}
    >
      <svg
        className={`w-5 h-5 text-white ${direction === 'left' ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function PortfolioShowcase() {
  const t = useTranslations('homePage.portfolio');
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const speedRef = useRef(0.5); // px per frame base
  const edgeSpeedRef = useRef(0); // velocitat extra per edge hover
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const pauseTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll continu amb loop infinit (duplicant cards)
  // Quan passem la meitat del scrollWidth (el set duplicat), tornem al principi sense salt
  useEffect(() => {
    if (reduceMotion) return;
    const el = scrollRef.current;
    if (!el) return;

    // Calcular ample d'un set de cards (sumant ample+gap de les originals)
    const cards = el.children;
    const half = cards.length / 2;
    let setWidth = 0;
    for (let c = 0; c < half; c++) {
      setWidth += (cards[c] as HTMLElement).offsetWidth + 20; // 20 = gap-5 (1.25rem)
    }

    const tick = () => {
      if (!pausedRef.current) {
        const speed = speedRef.current + edgeSpeedRef.current;

        el.scrollLeft += speed;

        // Reset seamless: quan passem el primer set, tornem enrere
        if (el.scrollLeft >= setWidth) {
          el.scrollLeft -= setWidth;
        } else if (el.scrollLeft < 0) {
          el.scrollLeft += setWidth;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduceMotion]);

  // Pausar auto-scroll quan l'usuari interactua
  const handleUserInteraction = useCallback(() => {
    pausedRef.current = true;
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => { pausedRef.current = false; }, 8000);
  }, []);

  // Edge hover: accelerar quan el ratolí s'acosta a les vores (desktop)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const edgeZone = width * 0.15; // 15% de cada vora

    if (x < edgeZone) {
      // Vora esquerra: scroll enrere
      const intensity = 1 - (x / edgeZone);
      edgeSpeedRef.current = -3 * intensity;
      pausedRef.current = false;
    } else if (x > width - edgeZone) {
      // Vora dreta: scroll endavant
      const intensity = 1 - ((width - x) / edgeZone);
      edgeSpeedRef.current = 3 * intensity;
      pausedRef.current = false;
    } else {
      edgeSpeedRef.current = 0;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    edgeSpeedRef.current = 0;
  }, []);

  // Parallax title on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const titleX = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    handleUserInteraction();
    const cardWidth = el.querySelector(':scope > *')?.clientWidth || 400;
    el.scrollBy({ left: direction === 'right' ? cardWidth + 20 : -(cardWidth + 20), behavior: 'smooth' });
  }, [handleUserInteraction]);

  return (
    <section ref={sectionRef} className="relative py-16 md:py-28 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-500/[0.02] blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="container mx-auto px-6 max-w-7xl mb-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <span className="inline-block px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold tracking-wider uppercase mb-4">
              {t('sectionLabel')}
            </span>
            <motion.h2
              style={reduceMotion ? {} : { x: titleX }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight"
            >
              {t('title')}{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
            </motion.h2>
            <p className="text-white/50 text-lg mt-3 max-w-2xl">{t('subtitle')}</p>
          </div>

          {/* Desktop scroll controls */}
          <div className="hidden md:flex items-center gap-2">
            <ScrollButton direction="left" onClick={() => scroll('left')} disabled={!canScrollLeft} />
            <ScrollButton direction="right" onClick={() => scroll('right')} disabled={!canScrollRight} />
          </div>
        </motion.div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        onTouchStart={handleUserInteraction}
        onMouseDown={handleUserInteraction}
        onWheel={handleUserInteraction}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex gap-5 overflow-x-auto px-6 md:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Dues còpies per loop infinit sense salt */}
        {[...EVENT_STORIES, ...EVENT_STORIES].map((story, i) => (
          <StoryCard
            key={`${story.id}-${i}`}
            story={story}
            t={t}
            reduceMotion={reduceMotion}
            index={i % EVENT_STORIES.length}
          />
        ))}
      </div>

      {/* Scroll hint - mobile */}
      <div className="md:hidden flex justify-center mt-4">
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          {t('swipeHint')}
        </div>
      </div>

      {/* View all link */}
      <div className="container mx-auto px-6 max-w-7xl mt-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-white font-semibold transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] group"
          >
            {t('viewAll')}
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
