'use client';

/**
 * MOBILE PORTFOLIO SHOWCASE - Òrbita Events
 * Hero image gran + strip horitzontal d'imatges per categoria
 * UX: tabs de categoria → imatge principal → scroll horitzontal de fotos
 */

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
import { PUBLIC_PORTFOLIO_SHOWCASE_ITEMS, getPublicPortfolioShowcasePhotos, type PublicPortfolioShowcaseStory } from '@/lib/publicHomeShowcase';

const DEFAULT_CATEGORIES: PublicPortfolioShowcaseStory[] = PUBLIC_PORTFOLIO_SHOWCASE_ITEMS.map((item) => ({
  ...item,
  photos: getPublicPortfolioShowcasePhotos(item.slug as never, Math.max(item.mobilePhotoCount, item.desktopPhotoCount)),
})).filter((item) => item.showInMobile);
type CategoryId = (typeof DEFAULT_CATEGORIES)[number]['id'];

export default function MobilePortfolioShowcase({ stories = DEFAULT_CATEGORIES }: { stories?: PublicPortfolioShowcaseStory[] }) {
  const t = useTranslations('homePage.portfolio');
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<CategoryId>('discomovil');
  const tabsRef = useRef<HTMLDivElement>(null);

  const mobileStories = stories.filter((item) => item.showInMobile);
  const active = mobileStories.find((c) => c.id === activeId) ?? mobileStories[0];
  const activePhotos = active ? active.photos.slice(0, active.mobilePhotoCount) : []; 

  const handleTabClick = (id: CategoryId, index: number) => {
    setActiveId(id);
    if (tabsRef.current) {
      const tab = tabsRef.current.children[index] as HTMLButtonElement;
      tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <section className="py-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(251,191,36,0.04),transparent_70%)] pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8 px-6"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider uppercase mb-3">
          {t('sectionLabel')}
        </span>
        <h2 className="text-3xl font-black text-white">
          {t('title')}{' '}
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            {t('titleHighlight')}
          </span>
        </h2>
      </motion.div>

      {/* Category tabs */}
      <div
        ref={tabsRef}
        className="flex gap-2.5 px-6 overflow-x-auto pb-1 mb-6 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
        {mobileStories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => handleTabClick(cat.id, i)}
            className={`flex-shrink-0 whitespace-nowrap snap-center px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
              activeId === cat.id
                ? `${cat.mobileBg} ${cat.mobileBorder} ${cat.mobileText}`
                : 'bg-white/5 border-white/10 text-white/60'
            }`}
          >
            {cat.emoji} {t(`categories.${cat.id}`)}
          </button>
        ))}
      </div>

      {/* Portfolio content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeId}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Hero image — full bleed */}
          {activePhotos[0] && (
            <Link
              href={`/portfolio/${active.slug}`}
              className="block relative mx-6 rounded-3xl overflow-hidden h-72 mb-3 group shadow-[0_12px_40px_rgba(0,0,0,0.3)]"
            >
              <Image
                src={activePhotos[0]}
                alt={`${t(`categories.${active.id}`)} 1`}
                fill
                sizes="100vw"
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:scale-[1.03]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="inline-flex items-center gap-2 mb-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-sm">
                  {active.emoji} {t(`categories.${active.id}`)}
                </div>
                <p className="text-sm text-white/70">{t('viewPortfolio')}</p>
              </div>
            </Link>
          )}

          {/* Horizontal image strip */}
          <div
            className="flex gap-3 overflow-x-auto pl-6 pr-3 pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
            {activePhotos.slice(1).map((src, i) => (
              <Link
                key={src}
                href={`/portfolio/${active.slug}`}
                className="snap-start flex-shrink-0 w-44 h-56 relative rounded-2xl overflow-hidden bg-zinc-900 group shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
              >
                <Image
                  src={src}
                  alt={`${t(`categories.${active.id}`)} ${i + 2}`}
                  fill
                  sizes="176px"
                  className="object-cover transition-transform duration-500 group-active:scale-[1.04]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </Link>
            ))}

            {/* "See all" card */}
            <Link
              href={`/portfolio/${active.slug}`}
              className="snap-start flex-shrink-0 w-44 h-56 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.10] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${active.mobileAccent} flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="text-center px-3">
                <p className="text-white font-bold text-sm">{t('viewPortfolio')}</p>
                <p className="text-white/50 text-xs mt-0.5">{t('viewPortfolioDesc')}</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* View all portfolio */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-8 px-6"
      >
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm font-medium hover:bg-white/10 active:scale-95 transition-all"
        >
          <span>{t('viewAll')}</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </motion.div>
    </section>
  );
}

