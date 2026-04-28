// app/[locale]/opiniones/page.tsx
// ═══════════════════════════════════════════════════════════════════════════
// ÒRBITA EVENTS — Pàgina d'opinions / ressenyes
// AggregateRating schema aquí (no a home, per evitar error Google Rich Results)
// ═══════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Link } from '@/lib/navigation';
import { SITE_CONFIG } from '@/app/config/site-config';
import { absoluteUrl, getSiteUrl } from '@/lib/site';
import GoogleGIcon from '@/app/components/public/GoogleGIcon';


export const revalidate = 3600;

const GoogleReviewsRotating = dynamic(
  () => import('@/app/components/home/GoogleReviewsRotating'),
  { ssr: false }
);

// ═══════════════════════════════════════════════════════════════════════════
// METADATA
// ═══════════════════════════════════════════════════════════════════════════

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isCA = locale === 'ca';
  const isEN = locale === 'en';

  const title = isCA
    ? `Opinions i Ressenyes Clients | ${SITE_CONFIG.stats.reviewCount}+ Valoracions 5 estrelles | Òrbita Events`
    : isEN
    ? `Client Reviews & Testimonials | ${SITE_CONFIG.stats.reviewCount}+ 5-Star Ratings | Orbita Events`
    : `Opiniones y Reseñas Clientes | ${SITE_CONFIG.stats.reviewCount}+ Valoraciones 5 estrellas | Orbita Events`;

  const description = isCA
    ? `Llegeix les opinions reals dels nostres clients. ${SITE_CONFIG.stats.reviewCount}+ ressenyes verificades a Google. Valoració ${SITE_CONFIG.stats.avgRating}/5. DJ i tematització a Barcelona i Girona.`
    : isEN
    ? `Read real reviews from our clients. ${SITE_CONFIG.stats.reviewCount}+ verified Google reviews. Rating ${SITE_CONFIG.stats.avgRating}/5. DJ and events in Barcelona & Girona.`
    : `Lee las opiniones reales de nuestros clientes. ${SITE_CONFIG.stats.reviewCount}+ reseñas verificadas en Google. Valoración ${SITE_CONFIG.stats.avgRating}/5. DJ y eventos en Barcelona y Girona.`;

  const base = getSiteUrl();
  return {
    title,
    description,
    alternates: {
      canonical: locale === 'ca' ? `${base}/opiniones` : `${base}/${locale}/opiniones`,
      languages: {
        'ca': `${base}/opiniones`,
        'es': `${base}/es/opiniones`,
        'en': `${base}/en/opiniones`,
        'x-default': `${base}/opiniones`,
      },
    },
    openGraph: {
      title,
      description,
      images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Orbita Events Opiniones' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default async function OpinionesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isCA = locale === 'ca';
  const isEN = locale === 'en';

  // AggregateRating JSON-LD — only on this dedicated page
  const aggregateRatingSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': absoluteUrl('/#organization'),
    name: 'Orbita Events',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(SITE_CONFIG.stats.avgRating),
      bestRating: '5',
      worstRating: '1',
      ratingCount: String(SITE_CONFIG.stats.reviewCount),
      reviewCount: String(SITE_CONFIG.stats.reviewCount),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isCA ? 'Inici' : isEN ? 'Home' : 'Inicio',
        item: absoluteUrl(`/${locale}`),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isCA ? 'Opinions' : isEN ? 'Reviews' : 'Opiniones',
        item: absoluteUrl(`/${locale}/opiniones`),
      },
    ],
  };

  const trustStats = [
    {
      value: `${SITE_CONFIG.stats.avgRating}/5`,
      label: isCA ? 'Valoració mitjana' : isEN ? 'Average rating' : 'Valoración media',
      icon: '⭐',
    },
    {
      value: `${SITE_CONFIG.stats.reviewCount}+`,
      label: isCA ? 'Ressenyes verificades' : isEN ? 'Verified reviews' : 'Reseñas verificadas',
      icon: '✅',
    },
    {
      value: `${SITE_CONFIG.stats.recommendRate}%`,
      label: isCA ? 'Recomanarien' : isEN ? 'Would recommend' : 'Recomendarían',
      icon: '🏆',
    },
    {
      value: `${SITE_CONFIG.stats.eventsCompleted}+`,
      label: isCA ? 'Esdeveniments' : isEN ? 'Events completed' : 'Eventos realizados',
      icon: '🎉',
    },
  ];

  const ctaLeaveReview = isCA ? 'Deixa la teva ressenya' : isEN ? 'Leave your review' : 'Deja tu reseña';
  const ctaBook = isCA ? 'Sol·licita pressupost' : isEN ? 'Get a quote' : 'Solicita presupuesto';

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="min-h-screen bg-bg-main relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 oe-vignette pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] bg-amber-500/[0.04] pointer-events-none" aria-hidden="true" />
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-24 pb-2 max-w-5xl">
          <nav className="flex items-center gap-2 text-sm text-white/40" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white/70 transition-colors">
              {isCA ? 'Inici' : isEN ? 'Home' : 'Inicio'}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-white/70" aria-current="page">
              {isCA ? 'Opinions' : isEN ? 'Reviews' : 'Opiniones'}
            </span>
          </nav>
        </div>

        {/* Hero */}
        <section className="container mx-auto px-4 pt-6 pb-10 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <span className="w-2 h-2 bg-amber-400 rounded-full" aria-hidden="true" />
            <span className="text-amber-400 text-sm font-medium">
              {isCA ? 'Opinions verificades de Google' : isEN ? 'Verified Google reviews' : 'Opiniones verificadas de Google'}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight tracking-tight">
            {isCA ? (
              <>
                El que diuen els{' '}
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  nostres clients
                </span>
              </>
            ) : isEN ? (
              <>
                What our{' '}
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  clients say
                </span>
              </>
            ) : (
              <>
                Lo que dicen{' '}
                <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  nuestros clientes
                </span>
              </>
            )}
          </h1>

          <p className="text-lg text-white/55 max-w-2xl mx-auto mb-10">
            {isCA
              ? `${SITE_CONFIG.stats.reviewCount}+ ressenyes reals · Valoració ${SITE_CONFIG.stats.avgRating}/5 · DJ i tematització a Barcelona i Girona`
              : isEN
              ? `${SITE_CONFIG.stats.reviewCount}+ real reviews · Rating ${SITE_CONFIG.stats.avgRating}/5 · DJ & events in Barcelona & Girona`
              : `${SITE_CONFIG.stats.reviewCount}+ reseñas reales · Valoración ${SITE_CONFIG.stats.avgRating}/5 · DJ y eventos en Barcelona y Girona`}
          </p>

          {/* Trust stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {trustStats.map((stat, i) => (
              <div key={i} className="card p-4 rounded-2xl text-center group hover:border-amber-500/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500">
                <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform duration-300" aria-hidden="true">{stat.icon}</span>
                <p className="text-2xl font-black text-oe-gold drop-shadow-[0_2px_8px_rgba(245,158,11,0.15)]">{stat.value}</p>
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Google Reviews Carousel */}
        <div className="relative">
          <div className="absolute inset-0 oe-grid-pattern pointer-events-none" aria-hidden="true" />
          <GoogleReviewsRotating showFooterCta={false} showHeader={false} />
        </div>

        {/* CTA dejar reseña */}
        <section className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-10 text-center hover:border-white/15 hover:shadow-[0_16px_48px_rgba(0,0,0,0.3)] transition-all duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
              {isCA
                ? 'Has gaudit del teu event amb nosaltres?'
                : isEN
                ? 'Did you enjoy your event with us?'
                : '¿Disfrutaste tu evento con nosotros?'}
            </h2>
            <p className="text-white/55 mb-8 max-w-md mx-auto">
              {isCA
                ? 'La teva ressenya ajuda altres parelles i famílies a triar el millor DJ per al seu dia especial.'
                : isEN
                ? 'Your review helps other couples and families choose the best DJ for their special day.'
                : 'Tu reseña ayuda a otras parejas y familias a elegir el mejor DJ para su día especial.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={SITE_CONFIG.reviews.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white text-[#1a1a1a] font-bold px-8 py-4 rounded-2xl hover:bg-neutral-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-white/10 text-sm md:text-base"
              >
                <GoogleGIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
                {ctaLeaveReview} ⭐
              </a>
              <Link
                href="/configurador"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900 font-bold rounded-2xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(251,191,36,0.3)] text-sm md:text-base"
              >
                {ctaBook} →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
