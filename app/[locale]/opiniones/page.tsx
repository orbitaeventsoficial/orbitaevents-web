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
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import FAQ from "@/components/seo/FAQ";

export const dynamic = 'force-dynamic';

// Reviews temporalment buit fins que s'activi el sistema de ressenyes
const REVIEWS: { author: string; rating: number; date?: string; comment?: string }[] = [];

// Datos dinámicos desde config
const { reviews, stats } = SITE_CONFIG;
const hasReviews = false; // Temporalmente deshabilitado (estructura de config cambiada)
const ratingDisplay = "Próximamente";
const countDisplay = 0;

export const metadata: Metadata = {
  title: hasReviews 
    ? `Opiniones Reales DJ Bodas Barcelona | ${ratingDisplay}/5 en ${countDisplay} Reseñas | Òrbita Events`
    : `Opiniones y Reseñas | Òrbita Events - DJ Bodas Barcelona`,
  description: hasReviews
    ? `Opiniones reales de bodas, fiestas y eventos. ${ratingDisplay}/5 en ${countDisplay} reseñas verificadas. Sonido impecable, iluminación cuidada y lleno de momentos inolvidables.`
    : `Más de ${stats.eventsCompleted} eventos realizados. Próximamente reseñas verificadas de Google. DJ profesional para bodas y eventos en Barcelona.`,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://orbitaevents.com"),
  alternates: { canonical: "/opiniones" },
  openGraph: {
    title: hasReviews 
      ? `Opiniones Reales | ${ratingDisplay}/5 | Òrbita Events`
      : `Opiniones y Reseñas | Òrbita Events`,
    description: hasReviews
      ? `${ratingDisplay}/5 en ${countDisplay} reseñas de bodas y eventos.`
      : `Más de ${stats.eventsCompleted} eventos realizados. DJ profesional en Barcelona.`,
    url: "/opiniones",
    images: [{ url: "/api/og?title=Opiniones%20Reales", alt: "Reseñas de bodas con DJ en Barcelona" }],
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: hasReviews 
      ? `Opiniones Reales | ${ratingDisplay}/5 | Òrbita Events`
      : `Opiniones y Reseñas | Òrbita Events`,
    description: hasReviews
      ? `${ratingDisplay}/5 en ${countDisplay} reseñas verificadas.`
      : `Más de ${stats.eventsCompleted} eventos realizados.`,
    images: ["/api/og?title=Opiniones%20Reales"],
  },
  robots: { index: true, follow: true },
};

const OpinionesClient = nextDynamic(() => import("./client"));

export default function OpinionesPage() {
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
    description: `Más de ${stats.eventsCompleted} eventos realizados en Catalunya.`,
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Inicio", url: "/" },
          { name: "Opiniones", url: "/opiniones" },
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
            q: "¿Qué opinan los clientes de Òrbita Events?",
            a: hasReviews
              ? `Valoración media de ${ratingDisplay}/5 en ${countDisplay} reseñas. Nuestros clientes destacan el sonido, el montaje y la capacidad del DJ para mantener la pista y divertir a los invitados.`
              : `Hemos realizado más de ${stats.eventsCompleted} eventos con clientes satisfechos. Próximamente podrás ver reseñas verificadas de Google.`,
          },
          {
            q: "¿Son reseñas reales?",
            a: hasReviews
              ? `Sí, todas verificadas de bodas y eventos en Barcelona y Girona. ${reviews.googleBusinessUrl ? 'Enlazamos directamente a Google.' : 'Pronto disponibles en Google Business.'}`
              : "Estamos en proceso de recopilar reseñas verificadas en Google Business. Mientras tanto, puedes contactarnos para referencias directas.",
          },
          {
            q: "¿Cómo puedo dejar una reseña?",
            a: reviews.googleBusinessUrl 
              ? `Puedes hacerlo desde nuestro perfil de Google Business o enviándola por correo a ${SITE_CONFIG.business.email}. Cada opinión cuenta y nos ayuda a seguir mejorando.`
              : `Puedes enviarnos tu opinión por correo a ${SITE_CONFIG.business.email}. Pronto activaremos nuestro perfil de Google Business para reseñas públicas.`,
          },
        ]}
      />
    </>
  );
}
