// app/opiniones/page.tsx
/**
 * Página de Opiniones - VERSIÓN DINÁMICA
 * ======================================
 *
 * REGLA: Todo tira de SITE_CONFIG y la BD
 * - Rating y count desde config (o BD cuando haya)
 * - Sin datos hardcodeados
 *
 * @author Manolo - Arquitecto Digital
 */

import { SITE_CONFIG } from '@/config/site-config';
import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import FAQ from "@/components/seo/FAQ";

export const dynamic = 'force-dynamic';

// Reviews temporalment buit fins que s'activi el sistema de ressenyes
const REVIEWS: { author: string; rating: number; date?: string; comment?: string }[] = [];

// Datos dinámicos desde config
const { reviews, stats } = SITE_CONFIG;
const hasReviews = false; // Temporalmente deshabilitado (estructura de config cambiada)
const countDisplay = 0;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'opinionsPage' });
  const ratingDisplay = t('comingSoon');

  return {
    title: hasReviews
      ? t('meta.titleWithReviews', { rating: ratingDisplay, count: countDisplay })
      : t('meta.title'),
    description: hasReviews
      ? t('meta.descriptionWithReviews', { rating: ratingDisplay, count: countDisplay })
      : t('meta.description', { events: stats.eventsCompleted }),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://orbitaevents.com"),
    alternates: { canonical: `/${params.locale}/opiniones` },
    openGraph: {
      title: hasReviews
        ? t('meta.ogTitleWithReviews', { rating: ratingDisplay })
        : t('meta.ogTitle'),
      description: hasReviews
        ? t('meta.ogDescriptionWithReviews', { rating: ratingDisplay, count: countDisplay })
        : t('meta.ogDescription', { events: stats.eventsCompleted }),
      url: "/opiniones",
      images: [{ url: "/api/og?title=Opiniones%20Reales", alt: t('meta.imageAlt') }],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: hasReviews
        ? t('meta.ogTitleWithReviews', { rating: ratingDisplay })
        : t('meta.ogTitle'),
      description: hasReviews
        ? t('meta.twitterDescriptionWithReviews', { rating: ratingDisplay, count: countDisplay })
        : t('meta.twitterDescription', { events: stats.eventsCompleted }),
      images: ["/api/og?title=Opiniones%20Reales"],
    },
    robots: { index: true, follow: true },
  };
}

const OpinionesClient = nextDynamic(() => import("./client"));

export default async function OpinionesPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('common');
  const tPage = await getTranslations({ locale: params.locale, namespace: 'opinionsPage' });
  const ratingDisplay = tPage('comingSoon');

  // Generar JSON-LD solo si hay reseñas
  const jsonLd = hasReviews ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.business.name,
    aggregateRating: hasReviews ? {
      "@type": "AggregateRating",
      ratingValue: 5,
      reviewCount: REVIEWS.length,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    review: REVIEWS.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewRating: { "@type": "Rating", ratingValue: r.rating },
      datePublished: r.date ? `${r.date}-01` : undefined,
      reviewBody: r.comment ?? "",
    })),
  } : {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.business.name,
    description: tPage('jsonLd.description', { events: stats.eventsCompleted }),
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { name: t('nav.home'), url: "/" },
          { name: t('nav.reviews'), url: "/opiniones" },
        ]}
      />

      {/* JSON-LD: AggregateRating + Reviews */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      {/* RESEÑAS */}
      <OpinionesClient />

      {/* FAQ AL FINAL - Con datos dinámicos */}
      <FAQ
        items={[
          {
            q: tPage('faq.q1'),
            a: hasReviews
              ? tPage('faq.a1WithReviews', { rating: ratingDisplay, count: countDisplay })
              : tPage('faq.a1', { events: stats.eventsCompleted }),
          },
          {
            q: tPage('faq.q2'),
            a: hasReviews
              ? tPage('faq.a2WithReviews', { hasGoogleUrl: reviews.googleBusinessUrl ? 'true' : 'false' })
              : tPage('faq.a2'),
          },
          {
            q: tPage('faq.q3'),
            a: reviews.googleBusinessUrl
              ? tPage('faq.a3WithGoogleUrl', { email: SITE_CONFIG.business.email })
              : tPage('faq.a3', { email: SITE_CONFIG.business.email }),
          },
        ]}
      />
    </>
  );
}
