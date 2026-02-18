'use client';

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE PORTFOLIO SHOWCASE - Òrbita Events
// Galeria de fotos reals amb pestanyes per categoria + scroll horitzontal
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useMobile } from './MobileAppShell';

// ── Dades de categories ────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'discomovil',
    label: '🎧 Discomòbil',
    accent: 'from-amber-500 to-orange-500',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    photos: Array.from({ length: 6 }, (_, i) =>
      `/img/portfolio/discomovil/discomovil-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'halloween',
    label: '🎃 Halloween',
    accent: 'from-orange-600 to-red-700',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    photos: Array.from({ length: 6 }, (_, i) =>
      `/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'mon-magic',
    label: '🪄 Món Màgic',
    accent: 'from-purple-600 to-pink-600',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    photos: Array.from({ length: 6 }, (_, i) =>
      `/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'bodas',
    label: '💍 Bodas',
    accent: 'from-pink-500 to-rose-500',
    border: 'border-pink-500/50',
    text: 'text-pink-400',
    bg: 'bg-pink-500/10',
    photos: Array.from({ length: 4 }, (_, i) =>
      `/img/portfolio/bodas/bodas-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'empreses',
    label: '🏢 Empreses',
    accent: 'from-blue-500 to-cyan-500',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    photos: Array.from({ length: 6 }, (_, i) =>
      `/img/portfolio/eventos-empresa/eventos-empresa-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'privades',
    label: '🎉 Privades',
    accent: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    photos: Array.from({ length: 6 }, (_, i) =>
      `/img/portfolio/fiestas-privadas/fiestas-privadas-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

// ── Component principal ────────────────────────────────────────────────────

export default function MobilePortfolioShowcase() {
  const { locale } = useMobile();
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<CategoryId>('discomovil');
  const tabsRef = useRef<HTMLDivElement>(null);

  const active = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  const handleTabClick = (id: CategoryId, index: number) => {
    setActiveId(id);
    // Scroll the tab into view
    if (tabsRef.current) {
      const tab = tabsRef.current.children[index] as HTMLButtonElement;
      tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <section className="py-14 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(251,191,36,0.04),transparent_70%)] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8 px-6"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
          El nostre treball
        </span>
        <h2 className="text-3xl font-black text-white">
          Events que parlen{' '}
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            per si sols
          </span>
        </h2>
      </motion.div>

      {/* Category tabs — horizontal scroll */}
      <div
        ref={tabsRef}
        className="flex gap-2.5 px-6 overflow-x-auto scrollbar-none pb-1 mb-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => handleTabClick(cat.id, i)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
              activeId === cat.id
                ? `${cat.bg} ${cat.border} ${cat.text}`
                : 'bg-white/5 border-white/10 text-white/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Photos grid — horizontal scroll */}
      <motion.div
        key={activeId}
        initial={reduceMotion ? false : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex gap-3 px-6 overflow-x-auto scrollbar-none pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {active.photos.map((src, i) => (
          <div
            key={src}
            className="relative flex-shrink-0 w-52 h-64 rounded-2xl overflow-hidden bg-zinc-900 shadow-xl"
          >
            <Image
              src={src}
              alt={`${active.label} ${i + 1}`}
              fill
              sizes="208px"
              className="object-cover"
              loading={i < 2 ? 'eager' : 'lazy'}
            />
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        ))}

        {/* "See more" card */}
        <a
          href={`/${locale}/portfolio`}
          className="relative flex-shrink-0 w-44 h-64 rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${active.accent} flex items-center justify-center`}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div className="text-center px-4">
            <p className="text-white font-bold text-sm">Veure tot</p>
            <p className="text-white/50 text-xs mt-0.5">el portfolio</p>
          </div>
        </a>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-8 px-6"
      >
        <a
          href={`/${locale}/portfolio`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm font-medium hover:bg-white/10 active:scale-95 transition-all"
        >
          <span>Veure tots els events</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </motion.div>
    </section>
  );
}
