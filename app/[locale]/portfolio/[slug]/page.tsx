// app/portfolio/[slug]/page.tsx
import { notFound } from "next/navigation";
import { PORTFOLIO_IMAGES, PORTFOLIO_CATEGORIES } from "@/config/portfolio-images";
import { Gallery } from "@/components/Gallery";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string; locale: string }>;
};

export default async function PortfolioSlugPage({ params }: PageProps) {
  const { slug } = await params;

  const images =
    (PORTFOLIO_IMAGES as Record<string, { src: string; alt: string }[]>)[slug] ??
    [];
  const category = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);

  if (!images.length) {
    notFound();
  }

  const title = category?.name ?? slug;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Inicio", url: "/" },
          { name: "Portfolio", url: "/portfolio" },
          { name: title, url: `/portfolio/${slug}` }
        ]}
      />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-12 bg-gradient-to-r from-oe-gold to-oe-gold-bright bg-clip-text text-transparent">
          {title}
        </h1>

        <Gallery images={images} />
      </main>
    </>
  );
}
