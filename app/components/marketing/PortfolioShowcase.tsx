'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO SHOWCASE — Cinematic horizontal scroll
// Each category = a visual "story" with overlay info
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

// ─── Event Stories Data ─────────────────────────────────────────────────────

interface EventStory {
  id: string;
  category: string;
  photos: string[];
  /** Translation key for overlay text */
  overlayKey: string;
}

const EVENT_STORIES: EventStory[] = [
  {
    id: 'discomovil',
    category: 'discomovil',
    photos: Array.from({ length: 10 }, (_, i) =>
      `/img/portfolio/discomovil/discomovil-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'discomovil',
  },
  {
    id: 'halloween',
    category: 'halloween',
    photos: Array.from({ length: 10 }, (_, i) =>
      `/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'halloween',
  },
  {
    id: 'monMagic',
    category: 'monMagic',
    photos: Array.from({ length: 9 }, (_, i) =>
      `/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'monMagic',
  },
  {
    id: 'bodas',
    category: 'bodas',
    photos: Array.from({ length: 4 }, (_, i) =>
      `/img/portfolio/bodas/bodas-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'bodas',
  },
  {
    id: 'empreses',
    category: 'empreses',
    photos: Array.from({ length: 9 }, (_, i) =>
      `/img/portfolio/eventos-empresa/eventos-empresa-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'empreses',
  },
];

// ─── Featured card (large) ──────────────────────────────────────────────────

function StoryCard({
  story,
  photoIndex,
  t,
  reduceMotion,
  featured,
}: {
  story: EventStory;
  photoIndex: number;
  t: ReturnType<typeof useTranslations>;
  reduceMotion: boolean | null;
  featured?: boolean;
}) {
  const src = story.photos[photoIndex % story.photos.length];
  const categoryName = t(`categories.${story.overlayKey}`);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.5 }}
      className={`relative flex-shrink-0 overflow-hidden rounded-2xl group cursor-pointer ${
        featured
          ? 'w-[85vw] md:w-[600px] h-[50vh] md:h-[420px]'
          : 'w-[70vw] md:w-[400px] h-[45vh] md:h-[360px]'
      }`}
    >
      <Image
        src={src}
        alt={`${categoryName} - Òrbita Events`}
        fill
        sizes={featured ? '(max-width: 768px) 85vw, 600px' : '(max-width: 768px) 70vw, 400px'}
        className="object-cover group-hover:scale-110 transition-transform duration-[1.2s] ease-out"
        loading="lazy"
      />

      {/* Dark gradient overlay — always visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-amber-500/10 to-transparent" />

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            {categoryName}
          </span>
        </div>
        <h3 className="text-white text-xl md:text-2xl font-bold leading-tight mb-1">
          {t(`stories.${story.overlayKey}.title`)}
        </h3>
        <p className="text-white/60 text-sm line-clamp-2">
          {t(`stories.${story.overlayKey}.desc`)}
        </p>
      </div>

      {/* Photo count badge */}
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 text-xs font-medium">
        {story.photos.length} fotos
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PortfolioShowcase() {
  const t = useTranslations('homePage.portfolio');
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -420 : 420;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  return (
    <section className="relative py-16 md:py-28 overflow-hidden">
      {/* Ambient background glow */}
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
            <h2 className="text-4xl md:text-5xl font-black text-white">
              {t('title')}{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
            </h2>
            <p className="text-white/50 text-lg mt-3 max-w-lg">{t('subtitle')}</p>
          </div>

          {/* Desktop scroll arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Anterior"
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-default"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Següent"
              className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all disabled:opacity-20 disabled:cursor-default"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Horizontal scroll — cinematic cards */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth px-6 md:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {EVENT_STORIES.map((story, i) => (
          <StoryCard
            key={story.id}
            story={story}
            photoIndex={0}
            t={t}
            reduceMotion={reduceMotion}
            featured={i === 0}
          />
        ))}
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none z-10" />
      <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-[#0A0A0A] to-transparent pointer-events-none z-10" />

      {/* CTA */}
      <div className="container mx-auto px-6 max-w-7xl mt-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-white font-semibold transition-all group"
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
