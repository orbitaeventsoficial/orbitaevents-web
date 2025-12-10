'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Paths correctes amb format WebP del portfolio real
const PORTFOLIO_IMAGES = [
  '/img/portfolio/bodas/bodas-01.webp',
  '/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
  '/img/portfolio/eventos-empresa/eventos-empresa-01.webp',
  '/img/portfolio/bodas/bodas-02.webp',
];

export default function PortfolioGrid() {
  const t = useTranslations('portfolioGrid');
  const items = t.raw('items') as { title: string }[];

  return (
    <div>
      <h2 className="text-h2 text-center">{t('title')}</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, idx) => (
          <figure key={item.title} className="overflow-hidden rounded-3xl border border-[var(--border)]">
            <Image
              src={PORTFOLIO_IMAGES[idx] || PORTFOLIO_IMAGES[0]}
              alt={item.title}
              width={600}
              height={400}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="h-52 w-full object-cover"
            />
            <figcaption className="p-4 text-white/80">{item.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
