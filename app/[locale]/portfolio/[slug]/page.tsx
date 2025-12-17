// app/portfolio/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { PORTFOLIO_IMAGES, PORTFOLIO_CATEGORIES } from "@/config/portfolio-images";
import { SimpleGallery } from "@/app/components/GalleryPro";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export default async function PortfolioSlugPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const tPortfolio = await getTranslations({ locale, namespace: 'pages.portfolio' });

  const images =
    (PORTFOLIO_IMAGES as Record<string, { src: string; alt: string }[]>)[slug] ??
    [];
  const category = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);

  if (!images.length) {
    notFound();
  }

  // Obtenir el nom traduït de la categoria
  let title: string;
  try {
    title = tPortfolio(`categories.${slug}`);
  } catch {
    title = category?.name ?? slug;
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { name: t('nav.home'), url: "/" },
          { name: t('nav.portfolio'), url: "/portfolio" },
          { name: title, url: `/portfolio/${slug}` }
        ]}
      />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-12 bg-gradient-to-r from-oe-gold to-oe-gold-bright bg-clip-text text-transparent">
          {title}
        </h1>

        <SimpleGallery images={images} />
      </main>
    </>
  );
}
