// app/[locale]/portfolio/[slug]/[eventSlug]/page.tsx
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

type PageProps = {
  params: Promise<{ slug: string; eventSlug: string; locale: string }>;
};

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
    description: event.description || `${event.title} — ${event.subtitle || categoryName}`,
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

      {/* Cinematic hero */}
      <section className="relative h-[65vh] md:h-[80vh] overflow-hidden">
        <Image
          src={event.coverImage}
          alt={event.title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          unoptimized={event.coverImage.startsWith('data:') || event.coverImage.includes('/api/uploads/')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-black/50 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="mx-auto max-w-7xl">
            <Link
              href={`/portfolio/${slug}`}
              className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4 hover:text-amber-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {categoryName}
            </Link>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="mt-4 text-white/60 text-xl md:text-2xl font-light">
                {event.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Event details strip */}
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

        {/* Gallery */}
        {galleryItems.length > 0 && (
          <section className="py-12 md:py-20 relative">
            <SimpleGallery images={galleryItems} />
          </section>
        )}

        {/* CTA */}
        <section className="py-12 md:py-16 text-center border-t border-white/10 relative">
          <p className="text-white/40 text-sm uppercase tracking-widest mb-3">
            {tPortfolio('eventDetail.wantSimilar')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/packs"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-zinc-900 font-black text-lg hover:scale-[1.03] active:scale-[0.98] transition-transform"
            >
              {tPortfolio('eventDetail.seePacks')}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
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
