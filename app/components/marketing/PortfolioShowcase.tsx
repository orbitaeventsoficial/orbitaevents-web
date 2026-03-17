'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO SHOWCASE — Visual story grid
// Cada categoria és una targeta clicable cap a la seva galeria
// ═══════════════════════════════════════════════════════════════════════════

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

interface EventStory {
  id: string;
  slug: string;
  category: string;
  photos: string[];
  overlayKey: string;
}

const EVENT_STORIES: EventStory[] = [
  {
    id: 'discomovil',
    slug: 'discomovil',
    category: 'discomovil',
    photos: Array.from({ length: 10 }, (_, i) =>
      `/img/portfolio/discomovil/discomovil-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'discomovil',
  },
  {
    id: 'halloween',
    slug: 'fiestas-tematicas-halloween',
    category: 'halloween',
    photos: Array.from({ length: 10 }, (_, i) =>
      `/img/portfolio/fiestas-tematicas-halloween/fiestas-tematicas-halloween-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'halloween',
  },
  {
    id: 'monMagic',
    slug: 'fiestas-tematicas-mon-magic',
    category: 'monMagic',
    photos: Array.from({ length: 9 }, (_, i) =>
      `/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'monMagic',
  },
  {
    id: 'bodas',
    slug: 'bodas',
    category: 'bodas',
    photos: Array.from({ length: 4 }, (_, i) =>
      `/img/portfolio/bodas/bodas-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'bodas',
  },
  {
    id: 'empreses',
    slug: 'eventos-empresa',
    category: 'empreses',
    photos: Array.from({ length: 9 }, (_, i) =>
      `/img/portfolio/eventos-empresa/eventos-empresa-${String(i + 1).padStart(2, '0')}.avif`
    ),
    overlayKey: 'empreses',
  },
];

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
    <Link
      href={`/portfolio/${story.slug}`}
      className={`group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_28px_100px_rgba(0,0,0,0.34)] ${
        featured ? 'xl:col-span-2' : ''
      }`}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 14 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden ${
          featured ? 'h-[24rem] md:h-[28rem]' : 'h-[20rem] md:h-[22rem]'
        }`}
      >
        <Image
          src={src}
          alt={`${categoryName} - Orbita Events`}
          fill
          sizes={featured ? '(max-width: 1280px) 100vw, 66vw' : '(max-width: 1280px) 100vw, 33vw'}
          className="object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/24 to-transparent" />
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-t from-amber-500/10 to-transparent" />

        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-sm border border-white/10 text-white/70 text-xs font-medium">
          {story.photos.length} fotos
        </div>

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
      </motion.div>
    </Link>
  );
}

export default function PortfolioShowcase() {
  const t = useTranslations('homePage.portfolio');
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-28 overflow-hidden">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-500/[0.02] blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl mb-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col gap-6"
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
            <p className="text-white/50 text-lg mt-3 max-w-2xl">{t('subtitle')}</p>
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
      </div>

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
