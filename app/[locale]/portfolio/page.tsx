// app/portfolio/page.tsx
import { Metadata } from 'next';
import { Link } from '@/lib/navigation';
import Image from 'next/image';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { PORTFOLIO_CATEGORIES } from '@/config/portfolio-images';
import { getTranslations } from 'next-intl/server';
import { getSiteUrl } from '@/lib/site';
import { listPortfolioEvents } from '@/lib/services/portfolioEventService';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.portfolio' });
  const base = getSiteUrl();

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: locale === 'ca' ? `${base}/portfolio` : `${base}/${locale}/portfolio`,
      languages: { ca: `${base}/portfolio`, es: `${base}/es/portfolio`, en: `${base}/en/portfolio` },
    },
  };
}

export default async function PortfolioHome({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'pages.portfolio' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const categories = PORTFOLIO_CATEGORIES;
  const { events } = await listPortfolioEvents({ published: true, limit: 200 });
  const managedCoverEntries = await Promise.all(
    categories.map(async (cat) => [cat.slug, await getManagedImageOverride(`portfolio.category.${cat.slug}.cover`)] as const)
  );

  const managedCoverMap = new Map<string, string>();
  for (const [slug, managed] of managedCoverEntries) {
    if (managed?.src) managedCoverMap.set(slug, managed.src);
  }

  const categoryCoverMap = new Map<string, string>();
  for (const eventItem of events) {
    if (!categoryCoverMap.has(eventItem.categorySlug) && eventItem.coverImage) {
      categoryCoverMap.set(eventItem.categorySlug, eventItem.coverImage);
    }
  }

  const getCategoryName = (slug: string): string => {
    try {
      return t(`categories.${slug}`);
    } catch {
      const cat = categories.find((item) => item.slug === slug);
      return cat?.name ?? slug;
    }
  };

  const resolveCover = (slug: string, fallback: string) => {
    return managedCoverMap.get(slug) || categoryCoverMap.get(slug) || fallback;
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { name: tCommon('breadcrumbs.home'), url: '/' },
          { name: t('breadcrumb'), url: '/portfolio' },
        ]}
      />

      <section className="mx-auto max-w-7xl px-6 md:px-8 py-20 md:py-28 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] bg-amber-500/[0.04] pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 oe-vignette pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 oe-grid-pattern pointer-events-none" aria-hidden="true" />

        <h1 className="text-5xl md:text-7xl font-black text-center bg-gradient-to-r from-white via-amber-100 to-oe-gold bg-clip-text text-transparent tracking-tight relative">
          {t('title')}
        </h1>
        <p className="text-center text-white/60 text-lg md:text-xl mb-16 md:mb-20 max-w-2xl mx-auto mt-4 relative">
          {t('subtitle')}
        </p>

        {categories.length === 0 ? (
          <p className="text-center text-white/60 text-lg">{t('noCategories')}</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {categories.slice(0, 2).map((cat) => {
                const translatedName = getCategoryName(cat.slug);
                return (
                  <Link
                    key={cat.slug}
                    href={`/portfolio/${encodeURIComponent(cat.slug)}`}
                    className="group relative overflow-hidden rounded-3xl h-[420px] md:h-[500px] transition-all duration-500 hover:shadow-[0_16px_64px_rgba(0,0,0,0.4),0_0_40px_rgba(245,158,11,0.06)]"
                  >
                    <Image
                      src={resolveCover(cat.slug, cat.cover)}
                      alt={translatedName}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={75}
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-amber-500/90 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20">
                      ★ Featured
                    </div>
                    <div className="absolute bottom-0 p-8 md:p-10 w-full">
                      <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">{t('viewGallery')}</span>
                      <h3 className="text-3xl md:text-4xl font-black text-white mt-2 group-hover:text-amber-50 transition-colors">
                        {translatedName}
                      </h3>
                      <div className="mt-3 flex items-center gap-2 text-white/50 text-sm group-hover:text-white/70 transition-colors">
                        <span>{t('viewGallery')}</span>
                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(2).map((cat, index) => {
                const translatedName = getCategoryName(cat.slug);
                const isPriority = index < 1;
                return (
                  <Link
                    key={cat.slug}
                    href={`/portfolio/${encodeURIComponent(cat.slug)}`}
                    className="group relative overflow-hidden rounded-2xl h-[320px] transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)]"
                  >
                    <Image
                      src={resolveCover(cat.slug, cat.cover)}
                      alt={translatedName}
                      fill
                      priority={isPriority}
                      loading={isPriority ? 'eager' : 'lazy'}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={65}
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 p-6 w-full">
                      <h3 className="text-2xl font-bold text-white group-hover:text-amber-50 transition-colors">{translatedName}</h3>
                      <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5 group-hover:text-white/60 transition-colors">
                        {t('viewGallery')}
                        <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
