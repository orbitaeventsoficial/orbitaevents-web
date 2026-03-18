// app/portfolio/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { PORTFOLIO_IMAGES, PORTFOLIO_CATEGORIES } from "@/config/portfolio-images";
import { SimpleGallery } from "@/app/components/GalleryPro";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { getSiteUrl } from '@/lib/site';
import { listPortfolioPhotos } from '@/lib/services/galleryService';
import { listPortfolioMedia } from '@/lib/services/portfolioMediaService';
import { listPortfolioEvents } from '@/lib/services/portfolioEventService';
import type { GalleryItem } from '@/app/components/GalleryPro';
import Image from 'next/image';
import { Link } from '@/lib/navigation';



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

  const firstImage = images[0]?.src || '/img/portfolio/bodas/bodas-01.avif';
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
    metadataBase: new URL(getSiteUrl()),
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

  const staticImages =
    (PORTFOLIO_IMAGES as Record<string, { src: string; alt: string }[]>)[slug] ??
    [];
  const category = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);

  // Fotos de bookings marcades com a portfolio
  let bookingImages: GalleryItem[] = [];
  try {
    const { photos } = await listPortfolioPhotos({ slug, limit: 100 });
    bookingImages = photos.map((p) => ({
      src: p.photoUrl,
      alt: p.caption || `${category?.name || slug} – foto event`,
    }));
  } catch {
    // Si falla (BD no disponible), continuar amb les estàtiques
  }

  // Media directe del portfolio (pujades des d'admin)
  let directMedia: GalleryItem[] = [];
  try {
    const items = await listPortfolioMedia(slug);
    directMedia = items.map((m) => ({
      src: m.mediaUrl,
      alt: m.caption || `${category?.name || slug} – ${m.mediaType}`,
      type: m.mediaType as 'image' | 'video',
    }));
  } catch {
    // Si falla, continuar
  }

  const images: GalleryItem[] = [...staticImages, ...bookingImages, ...directMedia];

  // Events concrets d'aquesta categoria
  type EventWithCount = { id: string; slug: string; title: string; subtitle: string | null; coverImage: string; venue: string | null; eventDate: Date | null; _count: { media: number } };
  let events: EventWithCount[] = [];
  try {
    const result = await listPortfolioEvents({ categorySlug: slug, published: true, limit: 20 });
    events = result.events as EventWithCount[];
  } catch {
    // Si falla, continuar
  }

  if (!images.length && !events.length) {
    notFound();
  }

  // Obtenir el nom traduït de la categoria
  let title: string;
  try {
    title = tPortfolio(`categories.${slug}`);
  } catch {
    title = category?.name ?? slug;
  }

  // Hero image = first image for cinematic intro
  const heroImage = images[0];
  const galleryImages = images.slice(1);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: t('nav.home'), url: "/" },
          { name: t('nav.portfolio'), url: "/portfolio" },
          { name: title, url: `/portfolio/${slug}` }
        ]}
      />

      {/* Cinematic hero */}
      <section className="relative h-[60vh] md:h-[75vh] overflow-hidden">
        <img
          src={heroImage.src}
          alt={heroImage.alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Portfolio</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight">
              {title}
            </h1>
            <p className="mt-4 text-white/50 text-lg">
              {images.length} {images.length === 1 ? 'foto' : 'fotos & vídeos'}
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-20 space-y-16">
        {/* Events destacats */}
        {events.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              {locale === 'en' ? 'Featured events' : locale === 'ca' ? 'Esdeveniments destacats' : 'Eventos destacados'}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/portfolio/${slug}/${ev.slug}`}
                  className="group relative overflow-hidden rounded-2xl h-[360px]"
                >
                  <Image
                    src={ev.coverImage}
                    alt={ev.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={70}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 p-6 md:p-8 w-full">
                    <h3 className="text-2xl md:text-3xl font-black text-white group-hover:text-amber-50 transition-colors">
                      {ev.title}
                    </h3>
                    {ev.subtitle && (
                      <p className="mt-1 text-white/50 text-sm">{ev.subtitle}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-white/40 text-xs">
                      {ev.venue && <span>{ev.venue}</span>}
                      {ev.eventDate && (
                        <span className="capitalize">
                          {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(ev.eventDate))}
                        </span>
                      )}
                      {ev._count.media > 0 && <span>{ev._count.media} fotos</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-amber-400 text-sm font-medium group-hover:text-amber-300 transition-colors">
                      <span>{locale === 'en' ? 'View event' : locale === 'ca' ? 'Veure event' : 'Ver evento'}</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Gallery mosaic */}
        {galleryImages.length > 0 && (
          <section>
            {events.length > 0 && (
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                {locale === 'en' ? 'Gallery' : locale === 'ca' ? 'Galeria' : 'Galería'}
              </h2>
            )}
            <SimpleGallery images={galleryImages} />
          </section>
        )}
      </main>
    </>
  );
}
