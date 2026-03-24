// app/portfolio/page.tsx
import { Metadata } from 'next';
import { Link } from '@/lib/navigation';
import Image from "next/image";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { PORTFOLIO_CATEGORIES } from "@/config/portfolio-images";
import { getTranslations } from 'next-intl/server';
import { getSiteUrl } from '@/lib/site';

export const revalidate = 3600;

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

  // Funció per obtenir el nom traduït de la categoria
  const getCategoryName = (slug: string): string => {
    try {
      return t(`categories.${slug}`);
    } catch {
      // Fallback al nom original si no hi ha traducció
      const cat = categories.find(c => c.slug === slug);
      return cat?.name ?? slug;
    }
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { name: tCommon('breadcrumbs.home'), url: "/" },
          { name: t('breadcrumb'), url: "/portfolio" }
        ]}
      />

      <section className="mx-auto max-w-7xl px-8 py-20 relative">
        <h1 className="text-5xl md:text-6xl font-bold text-center bg-gradient-to-r from-oe-gold to-oe-gold-bright bg-clip-text text-transparent">
          {t('title')}
        </h1>
        <p className="text-center text-white/70 text-xl mb-16 max-w-3xl mx-auto">
          {t('subtitle')}
        </p>

        {categories.length === 0 ? (
          <p className="text-center text-white/60 text-lg">
            {t('noCategories')}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Featured — first 2 categories as large cinematic cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {categories.slice(0, 2).map((cat, index) => {
                const translatedName = getCategoryName(cat.slug);
                return (
                  <Link
                    key={cat.slug}
                    href={`/portfolio/${encodeURIComponent(cat.slug)}`}
                    className="group relative overflow-hidden rounded-3xl h-[420px] md:h-[500px]"
                  >
                    <Image
                      src={cat.cover}
                      alt={translatedName}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      quality={75}
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 p-8 md:p-10 w-full">
                      <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">
                        {t('viewGallery')}
                      </span>
                      <h3 className="text-3xl md:text-4xl font-black text-white mt-2 group-hover:text-amber-50 transition-colors">
                        {translatedName}
                      </h3>
                      <div className="mt-3 flex items-center gap-2 text-white/50 text-sm group-hover:text-white/70 transition-colors">
                        <span>{t('viewGallery')}</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Rest — 3-column grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(2).map((cat, index) => {
                const translatedName = getCategoryName(cat.slug);
                const isPriority = index < 1;
                return (
                  <Link
                    key={cat.slug}
                    href={`/portfolio/${encodeURIComponent(cat.slug)}`}
                    className="group relative overflow-hidden rounded-2xl h-[320px]"
                  >
                    <Image
                      src={cat.cover}
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
                      <h3 className="text-2xl font-bold text-white group-hover:text-amber-50 transition-colors">
                        {translatedName}
                      </h3>
                      <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5 group-hover:text-white/60 transition-colors">
                        {t('viewGallery')}
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
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
