export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { PORTFOLIO_IMAGES, PORTFOLIO_CATEGORIES } from '@/config/portfolio-images';
import { SimpleGallery } from '@/app/components/GalleryPro';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { getSiteUrl } from '@/lib/site';
import { listPortfolioPhotos } from '@/lib/services/galleryService';
import { listPortfolioMedia } from '@/lib/services/portfolioMediaService';
import { listPortfolioEvents } from '@/lib/services/portfolioEventService';
import type { GalleryItem } from '@/app/components/GalleryPro';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';
import { toIntlLocale } from '@/lib/constants';

function isVideoAsset(src: string): boolean {
  const normalized = src.split('?')[0]?.toLowerCase() || '';
  return ['.mp4', '.webm', '.mov', '.m4v'].some((ext) => normalized.endsWith(ext));
}

function resolveHeroMedia(items: GalleryItem[], fallback: { src: string; alt: string }) {
  if (!items.length) {
    return {
      heroIndex: -1,
      media: {
        src: fallback.src,
        alt: fallback.alt,
        type: 'image' as const,
      },
    };
  }

  const heroIndex = items.findIndex((item) => item.type === 'video' || isVideoAsset(item.src));
  const finalIndex = heroIndex >= 0 ? heroIndex : 0;
  const media = items[finalIndex];

  return {
    heroIndex: finalIndex,
    media: {
      src: media.src,
      alt: media.alt,
      type: media.type === 'video' || isVideoAsset(media.src) ? 'video' as const : 'image' as const,
    },
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const tPortfolio = await getTranslations({ locale, namespace: 'pages.portfolio' });

  const category = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);
  const staticImages = (PORTFOLIO_IMAGES as Record<string, { src: string; alt: string }[]>)[slug] ?? [];

  let title: string;
  try {
    title = tPortfolio(`categories.${slug}`);
  } catch {
    title = category?.name ?? slug;
  }

  let mediaPreview: string | undefined;
  try {
    const items = await listPortfolioMedia(slug);
    mediaPreview = items[0]?.mediaUrl;
  } catch {
    // continuar amb altres fallbacks
  }

  if (!mediaPreview) {
    try {
      const { photos } = await listPortfolioPhotos({ slug, limit: 1, includeTotal: false });
      mediaPreview = photos[0]?.photoUrl;
    } catch {
      // continuar amb altres fallbacks
    }
  }

  if (!mediaPreview) {
    try {
      const result = await listPortfolioEvents({ categorySlug: slug, published: true, limit: 1 });
      mediaPreview = result.events[0]?.coverImage;
    } catch {
      // continuar amb l'estàtic
    }
  }

  const firstImage = mediaPreview || staticImages[0]?.src || '/img/portfolio/bodas/bodas-01.avif';
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

type EventWithCount = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverImage: string;
  venue: string | null;
  eventDate: Date | null;
  _count: { media: number };
};

export default async function PortfolioSlugPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const tPortfolio = await getTranslations({ locale, namespace: 'pages.portfolio' });

  const staticImages = (PORTFOLIO_IMAGES as Record<string, GalleryItem[]>)[slug] ?? [];
  const category = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);

  let bookingImages: GalleryItem[] = [];
  try {
    const { photos } = await listPortfolioPhotos({ slug, limit: 100, includeTotal: false });
    bookingImages = photos.map((p) => ({
      src: p.photoUrl,
      alt: p.caption || `${category?.name || slug} - foto event`,
    }));
  } catch {
    // Si falla (BD no disponible), continuar amb les estàtiques
  }

  let directMedia: GalleryItem[] = [];
  try {
    const items = await listPortfolioMedia(slug);
    directMedia = items.map((m) => ({
      src: m.mediaUrl,
      alt: m.caption || `${category?.name || slug} - ${m.mediaType}`,
      type: m.mediaType as 'image' | 'video',
    }));
  } catch {
    // Si falla, continuar
  }

  const dynamicImages: GalleryItem[] = directMedia.length > 0 ? directMedia : bookingImages;
  const images: GalleryItem[] = dynamicImages.length > 0 ? dynamicImages : staticImages;

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

  let title: string;
  try {
    title = tPortfolio(`categories.${slug}`);
  } catch {
    title = category?.name ?? slug;
  }

  const fallbackHero = {
    src: events[0]?.coverImage || '/img/portfolio/bodas/bodas-01.avif',
    alt: events[0]?.title || title,
  };
  const { heroIndex, media: heroMedia } = resolveHeroMedia(images, fallbackHero);
  const galleryImages = images.filter((_, index) => index !== heroIndex);

  const base = getSiteUrl();
  const onlyImages = images.filter((item) => item.type !== 'video' && !isVideoAsset(item.src));
  const imageGalleryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: title,
    description: `${title} - Òrbita Events Portfolio`,
    url: `${base}/${locale}/portfolio/${slug}`,
    numberOfItems: onlyImages.length,
    image: onlyImages.slice(0, 20).map((img) => ({
      '@type': 'ImageObject',
      contentUrl: img.src.startsWith('http') ? img.src : `${base}${img.src}`,
      description: img.alt,
    })),
    isPartOf: {
      '@type': 'WebPage',
      name: 'Portfolio - Òrbita Events',
      url: `${base}/${locale}/portfolio`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageGalleryJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { name: t('nav.home'), url: '/' },
          { name: t('nav.portfolio'), url: '/portfolio' },
          { name: title, url: `/portfolio/${slug}` },
        ]}
      />

      <section className="relative h-[34svh] min-h-[280px] sm:h-[44svh] md:h-[54vh] lg:h-[70vh] overflow-hidden border-b border-white/10">
        {heroMedia.type === 'video' ? (
          <video
            src={heroMedia.src}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={heroMedia.src}
            alt={heroMedia.alt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized={heroMedia.src.startsWith('data:') || heroMedia.src.includes('/api/uploads/')}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-black/48 to-black/20" />
        <div className="absolute inset-0 oe-vignette pointer-events-none" />
        <div className="absolute inset-0 oe-film-grain pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 p-4 sm:hidden">
          <div className="inline-flex max-w-[92vw] flex-col rounded-[22px] border border-white/10 bg-black/38 px-4 py-3 backdrop-blur-md shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
            <p className="text-amber-400 text-[10px] font-semibold tracking-[0.28em] uppercase mb-2">Portfolio</p>
            <h1 className="text-[clamp(1.8rem,8vw,2.65rem)] font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_60px_rgba(0,0,0,0.6)]">
              {title}
            </h1>
            <div className="mt-2 inline-flex rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72">
              {images.length} {images.length === 1 ? tPortfolio('eventDetail.photo') : tPortfolio('eventDetail.photosVideos')}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 hidden p-6 sm:block lg:hidden">
          <div className="max-w-2xl rounded-[28px] border border-white/10 bg-black/30 p-6 backdrop-blur-md shadow-[0_24px_72px_rgba(0,0,0,0.34)]">
            <p className="text-amber-400 text-xs font-semibold tracking-[0.28em] uppercase mb-3">Portfolio</p>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_60px_rgba(0,0,0,0.6)]">
              {title}
            </h1>
            <p className="mt-3 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/68 backdrop-blur-sm">
              {images.length} {images.length === 1 ? tPortfolio('eventDetail.photo') : tPortfolio('eventDetail.photosVideos')}
            </p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 hidden p-16 lg:block">
          <div className="mx-auto max-w-7xl">
            <p className="text-amber-400 text-sm font-semibold tracking-[0.28em] uppercase mb-3">Portfolio</p>
            <h1 className="text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_60px_rgba(0,0,0,0.6)]">
              {title}
            </h1>
            <p className="mt-3 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/68 backdrop-blur-sm">
              {images.length} {images.length === 1 ? tPortfolio('eventDetail.photo') : tPortfolio('eventDetail.photosVideos')}
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 md:px-6 py-12 md:py-20 space-y-16 relative">
        {events.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              {tPortfolio('eventDetail.featuredEvents')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/portfolio/${slug}/${ev.slug}`}
                  className="group relative overflow-hidden rounded-2xl h-[360px] transition-shadow duration-500 hover:shadow-[0_16px_64px_rgba(0,0,0,0.4),0_0_30px_rgba(245,158,11,0.06)]"
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
                          {new Intl.DateTimeFormat(toIntlLocale(locale), { year: 'numeric', month: 'long' }).format(new Date(ev.eventDate))}
                        </span>
                      )}
                      {ev._count.media > 0 && <span>{ev._count.media} {tPortfolio('eventDetail.photosVideos')}</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-amber-400 text-sm font-medium group-hover:text-amber-300 transition-colors">
                      <span>{tPortfolio('eventDetail.viewEvent')}</span>
                      <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {galleryImages.length > 0 && (
          <section>
            {events.length > 0 && (
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
                {tPortfolio('eventDetail.gallery')}
              </h2>
            )}
            <SimpleGallery images={galleryImages} />
          </section>
        )}
      </main>
    </>
  );
}
