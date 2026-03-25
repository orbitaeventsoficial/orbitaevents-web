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

      <main className="min-h-screen bg-[#0A0A0A] relative oe-grid-pattern">
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

          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            {isCA ? (
              <>
                El que diuen els{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  nostres clients
                </span>
              </>
            ) : isEN ? (
              <>
                What our{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  clients say
                </span>
              </>
            ) : (
              <>
                Lo que dicen{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
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

          {/* Trust stats — delegat a StatsSection unificat */}
        </section>

        {/* Google Reviews Carousel */}
        <GoogleReviewsRotating showFooterCta={false} />

        {/* CTA dejar reseña */}
        <section className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
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
                className="inline-flex items-center gap-3 bg-white text-[#1a1a1a] font-bold px-8 py-4 rounded-2xl hover:bg-neutral-100 transition-all shadow-lg shadow-white/5 text-sm md:text-base"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {ctaLeaveReview} ⭐
              </a>
              <Link
                href="/configurador"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-900 font-bold rounded-2xl hover:opacity-90 transition-opacity text-sm md:text-base"
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
