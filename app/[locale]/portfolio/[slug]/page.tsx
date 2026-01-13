// app/portfolio/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { PORTFOLIO_IMAGES, PORTFOLIO_CATEGORIES } from "@/config/portfolio-images";
import { SimpleGallery } from "@/app/components/GalleryPro";
import Breadcrumbs from "@/components/seo/Breadcrumbs";


export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const tPortfolio = await getTranslations({ locale, namespace: 'pages.portfolio' });

  const category = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);
  const images = (PORTFOLIO_IMAGES as Record<string, { src: string; alt: string }[]>)[slug] ?? [];

  let title: string;
  try {
    title = tPortfolio(`categories.${slug}`);
  } catch {
    title = category?.name ?? slug;
  }

  const firstImage = images[0]?.src || '/img/portfolio/bodas/bodas-01.webp';
  const isEs = locale === 'es';

  const metaTitle = isEs
    ? `${title} | Portfolio Òrbita Events`
    : `${title} | Portfolio Òrbita Esdeveniments`;

  const metaDescription = isEs
    ? `Galería de fotos de ${title.toLowerCase()}. Descubre nuestros eventos y producciones en Barcelona, Girona y Costa Brava.`
    : `Galeria de fotos de ${title.toLowerCase()}. Descobreix els nostres esdeveniments i produccions a Barcelona, Girona i Costa Brava.`;

  return {
    title: metaTitle,
    description: metaDescription,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://orbitaevents.com'),
    alternates: { canonical: `/portfolio/${slug}` },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: `/portfolio/${slug}`,
      images: [{ url: firstImage, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [firstImage],
    },
    robots: { index: true, follow: true },
  };
}

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
