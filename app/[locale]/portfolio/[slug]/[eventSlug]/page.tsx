export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPortfolioEvent } from '@/lib/services/portfolioEventService';
import { SimpleGallery } from '@/app/components/GalleryPro';
import type { GalleryItem } from '@/app/components/GalleryPro';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { PORTFOLIO_CATEGORIES } from '@/config/portfolio-images';
import { getSiteUrl } from '@/lib/site';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import ArrowRightIcon from '@/app/components/public/ArrowRightIcon';

type PageProps = {
  params: Promise<{ slug: string; eventSlug: string; locale: string }>;
};

function isVideoAsset(src: string): boolean {
  const normalized = src.split('?')[0]?.toLowerCase() || '';
  return ['.mp4', '.webm', '.mov', '.m4v'].some((ext) => normalized.endsWith(ext));
}

function resolveEventHeroMedia(event: Awaited<ReturnType<typeof getPortfolioEvent>>) {
  const featuredVideo = event?.media.find((media) => media.mediaType === 'video' || isVideoAsset(media.mediaUrl));
  if (featuredVideo) {
    return {
      src: featuredVideo.mediaUrl,
      alt: featuredVideo.caption || event?.title || 'Portfolio event video',
      type: 'video' as const,
    };
  }

  const firstMedia = event?.media[0];
  if (firstMedia) {
    return {
      src: firstMedia.mediaUrl,
      alt: firstMedia.caption || event?.title || 'Portfolio event media',
      type: firstMedia.mediaType === 'video' || isVideoAsset(firstMedia.mediaUrl) ? 'video' as const : 'image' as const,
    };
  }

  return {
    src: event?.coverImage || '',
    alt: event?.title || 'Portfolio event image',
    type: 'image' as const,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, eventSlug, locale } = await params;

  let event;
  try {
    event = await getPortfolioEvent(eventSlug);
  } catch {
    return { title: 'Event no trobat' };
  }
  if (!event || !event.published) return { title: 'Event no trobat' };

  const category = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);
  const categoryName = category?.name || slug;

  return {
    title: `${event.title} | ${categoryName} | Òrbita Events`,
    description: event.description || `${event.title} - ${event.subtitle || categoryName}`,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: `/portfolio/${slug}/${eventSlug}` },
    openGraph: {
      title: event.title,
      description: event.description || event.subtitle || categoryName,
      url: `/portfolio/${slug}/${eventSlug}`,
      images: [{ url: event.coverImage, alt: event.title }],
      type: 'article',
    },
    robots: { index: true, follow: true },
  };
}

export default async function PortfolioEventPage({ params }: PageProps) {
  const { slug, eventSlug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const tPortfolio = await getTranslations({ locale, namespace: 'pages.portfolio' });

  let event;
  try {
    event = await getPortfolioEvent(eventSlug);
  } catch {
    notFound();
  }
  if (!event || !event.published) notFound();

  const category = PORTFOLIO_CATEGORIES.find((c) => c.slug === slug);
  let categoryName: string;
  try {
    categoryName = tPortfolio(`categories.${slug}`);
  } catch {
    categoryName = category?.name || slug;
  }

  const galleryItems: GalleryItem[] = event.media.map((m) => ({
    src: m.mediaUrl,
    alt: m.caption || event.title,
    type: m.mediaType as 'image' | 'video',
  }));
  const heroMedia = resolveEventHeroMedia(event);

  const dateFormatted = event.eventDate
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(event.eventDate))
    : null;

  return (
    <>
      <Breadcrumbs
        items={[
          { name: t('nav.home'), url: '/' },
          { name: t('nav.portfolio'), url: '/portfolio' },
          { name: categoryName, url: `/portfolio/${slug}` },
          { name: event.title, url: `/portfolio/${slug}/${eventSlug}` },
        ]}
      />

      <section className="relative h-[38svh] min-h-[300px] sm:h-[50svh] md:h-[58vh] lg:h-[74vh] overflow-hidden border-b border-white/10">
        {heroMedia.type === 'video' ? (
          <video
            src={heroMedia.src}
            poster={event.coverImage}
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
        <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-black/65 to-black/24" />
        <div className="absolute inset-0 oe-vignette pointer-events-none" />
        <div className="absolute inset-0 oe-film-grain pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 p-4 sm:hidden">
          <div className="rounded-[24px] border border-white/10 bg-black/38 p-4 backdrop-blur-md shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
            <Link
              href={`/portfolio/${slug}`}
              className="inline-flex items-center gap-1.5 text-amber-400 text-[10px] font-semibold tracking-[0.26em] uppercase mb-2 hover:text-amber-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {categoryName}
            </Link>
            <h1 className="max-w-[14ch] text-[clamp(1.9rem,8vw,2.85rem)] font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_60px_rgba(0,0,0,0.6)]">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="mt-2 max-w-[28ch] text-sm font-light leading-snug text-white/72">
                {event.subtitle}
              </p>
            )}
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/72">
              {galleryItems.length} {galleryItems.length === 1 ? tPortfolio('eventDetail.photo') : tPortfolio('eventDetail.photosVideos')}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 hidden p-6 sm:block lg:hidden">
          <div className="max-w-2xl rounded-[28px] border border-white/10 bg-black/30 p-6 backdrop-blur-md shadow-[0_24px_72px_rgba(0,0,0,0.34)]">
            <Link
              href={`/portfolio/${slug}`}
              className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-semibold tracking-[0.28em] uppercase mb-3 hover:text-amber-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {categoryName}
            </Link>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_60px_rgba(0,0,0,0.6)]">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="mt-3 max-w-2xl text-lg font-light text-white/72">
                {event.subtitle}
              </p>
            )}
            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/68 backdrop-blur-sm">
              {galleryItems.length} {galleryItems.length === 1 ? tPortfolio('eventDetail.photo') : tPortfolio('eventDetail.photosVideos')}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 hidden p-16 lg:block">
          <div className="mx-auto max-w-7xl">
            <Link
              href={`/portfolio/${slug}`}
              className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-semibold tracking-[0.28em] uppercase mb-4 hover:text-amber-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {categoryName}
            </Link>
            <h1 className="max-w-4xl text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_60px_rgba(0,0,0,0.6)]">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="mt-4 max-w-2xl text-2xl font-light text-white/72">
                {event.subtitle}
              </p>
            )}
            <div className="mt-4 inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/68 backdrop-blur-sm">
              {galleryItems.length} {galleryItems.length === 1 ? tPortfolio('eventDetail.photo') : tPortfolio('eventDetail.photosVideos')}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 md:px-6">
        <section className="py-10 md:py-14 border-b border-white/10">
          <div className="flex flex-wrap gap-8 md:gap-16">
            {event.venue && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{tPortfolio('eventDetail.venue')}</p>
                <p className="text-lg font-semibold text-white">{event.venue}</p>
                {event.location && <p className="text-sm text-white/50">{event.location}</p>}
              </div>
            )}
            {dateFormatted && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{tPortfolio('eventDetail.date')}</p>
                <p className="text-lg font-semibold text-white capitalize">{dateFormatted}</p>
              </div>
            )}
            {event.guestCount && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{tPortfolio('eventDetail.guests')}</p>
                <p className="text-lg font-semibold text-white">{event.guestCount}</p>
              </div>
            )}
            {event.services.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{tPortfolio('eventDetail.services')}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {event.services.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm font-medium border border-amber-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-8 text-white/60 text-lg leading-relaxed max-w-3xl">
              {event.description}
            </p>
          )}
        </section>

        {galleryItems.length > 0 && (
          <section className="py-12 md:py-20 relative">
            <SimpleGallery images={galleryItems} />
          </section>
        )}

        <section className="py-12 md:py-16 text-center border-t border-white/10 relative">
          <p className="text-white/40 text-sm uppercase tracking-widest mb-3">
            {tPortfolio('eventDetail.wantSimilar')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/packs"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-zinc-900 font-black text-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(251,191,36,0.3)]"
            >
              {tPortfolio('eventDetail.seePacks')}
              <ArrowRightIcon className="w-5 h-5" strokeWidth={3} />
            </Link>
            <Link
              href="/configurador"
              className="inline-flex items-center gap-2 px-8 py-5 rounded-2xl border border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-lg transition-all"
            >
              {tPortfolio('eventDetail.buildEvent')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
