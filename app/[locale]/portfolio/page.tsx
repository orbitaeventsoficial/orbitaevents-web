// app/portfolio/page.tsx
import { Link } from '@/lib/navigation';
import Image from "next/image";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { PORTFOLIO_CATEGORIES } from "@/config/portfolio-images";
import { getTranslations } from 'next-intl/server';


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

      <section className="mx-auto max-w-7xl px-8 py-20">
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
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, index) => {
              const translatedName = getCategoryName(cat.slug);
              // Primeres 3 imatges carreguen amb prioritat (above the fold)
              const isPriority = index < 3;
              return (
                <Link
                  key={cat.slug}
                  href={`/portfolio/${encodeURIComponent(cat.slug)}`}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl hover:shadow-oe-gold/20 transition-all duration-500 hover:-translate-y-4"
                >
                  <Image
                    src={cat.cover}
                    alt={translatedName}
                    width={800}
                    height={600}
                    priority={isPriority}
                    loading={isPriority ? 'eager' : 'lazy'}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={70}
                    className="h-80 w-full object-cover transition group-hover:scale-110 duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 p-8 w-full">
                    <h3 className="text-3xl font-bold text-white drop-shadow-2xl">
                      {translatedName}
                    </h3>
                    <p className="text-oe-gold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('viewGallery')}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
