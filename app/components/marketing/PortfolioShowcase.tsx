'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO SHOWCASE (DESKTOP) - Òrbita Events
// Grid de fotos reals de tots els events amb hover elegant
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

const CATEGORY_CONFIGS = [
  {
    id: 'all' as const,
    emoji: '📋',
    photos: [
      '/img/portfolio/discomovil/discomovil-01.avif',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-01.avif',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.avif',
      '/img/portfolio/bodas/bodas-01.avif',
      '/img/portfolio/eventos-empresa/eventos-empresa-01.avif',
      '/img/portfolio/fiestas-privadas/fiestas-privadas-01.avif',
      '/img/portfolio/discomovil/discomovil-05.avif',
      '/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-05.avif',
      '/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-05.avif',
    ],
  },
  {
    id: 'discomovil' as const,
    emoji: '🎧',
    photos: Array.from({ length: 9 }, (_, i) =>
      `/img/portfolio/discomovil/discomovil-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'halloween' as const,
    emoji: '🎃',
    photos: Array.from({ length: 9 }, (_, i) =>
      `/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'monMagic' as const,
    emoji: '🪄',
    photos: Array.from({ length: 9 }, (_, i) =>
      `/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'bodas' as const,
    emoji: '💍',
    photos: Array.from({ length: 4 }, (_, i) =>
      `/img/portfolio/bodas/bodas-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
  {
    id: 'empreses' as const,
    emoji: '🏢',
    photos: Array.from({ length: 9 }, (_, i) =>
      `/img/portfolio/eventos-empresa/eventos-empresa-${String(i + 1).padStart(2, '0')}.avif`
    ),
  },
] as const;

type CategoryId = (typeof CATEGORY_CONFIGS)[number]['id'];

export default function PortfolioShowcase() {
  const t = useTranslations('homePage.portfolio');
  const [activeId, setActiveId] = useState<CategoryId>('all');
  const reduceMotion = useReducedMotion();

  const active = CATEGORY_CONFIGS.find((c) => c.id === activeId) ?? CATEGORY_CONFIGS[0];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/30 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold tracking-wider uppercase mb-4">
            {t('sectionLabel')}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">
            {t('title')}{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>
          </h2>
          <p className="text-white/50 text-lg">{t('subtitle')}</p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          {CATEGORY_CONFIGS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveId(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                activeId === cat.id
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.emoji} {t(`categories.${cat.id}`)}
            </button>
          ))}
        </motion.div>

        {/* Photo grid */}
        <motion.div
          key={activeId}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-3 gap-3 md:gap-4"
        >
          {active.photos.map((src, i) => (
            <motion.div
              key={src}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={reduceMotion ? { duration: 0 } : { delay: i * 0.04 }}
              className={`relative overflow-hidden rounded-2xl bg-zinc-900 group cursor-pointer ${
                i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
              }`}
            >
              <Image
                src={src}
                alt={`Event ${i + 1}`}
                fill
                sizes={i === 0 ? '(max-width: 768px) 66vw, 500px' : '(max-width: 768px) 33vw, 250px'}
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                loading={i < 3 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl text-white font-semibold transition-all"
          >
            {t('viewAll')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
