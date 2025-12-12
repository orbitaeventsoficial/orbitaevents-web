// app/faq/page.tsx
// 🔥 MANOLO VERSION - Optimizado para capturar leads de alta intención

import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from "@\/components/seo/Breadcrumbs";
import { FAQ_DATA } from "@/config/faq-data";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "FAQ DJ Bodas Barcelona | Respuestas Claras y Reales | Órbita Events",
  description:
    "Precios, equipamiento técnico, limitadores de sonido y cancelaciones. Todo lo que necesitas saber antes de contratar. Transparencia total para que tomes la mejor decisión.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://orbitaevents.com"
  ),
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ DJ Bodas | Respuestas Claras y Útiles",
    description: "Precios, limitadores, cancelaciones y más. Todo explicado con transparencia.",
    url: "/faq",
    images: [
      {
        url: "/api/og?title=FAQ%20Respuestas%20Claras",
        alt: "FAQ DJ bodas Barcelona - Respuestas reales y transparentes",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ DJ Bodas | Respuestas Reales y Sin Rodeos",
    description: "Precios, equipamiento, limitadores... toda la información que necesitas antes de reservar.",
    images: ["/api/og?title=FAQ%20DJ%20Bodas%20Barcelona"],
  },
  robots: { index: true, follow: true },
  keywords: [
    "FAQ DJ bodas Barcelona",
    "preguntas frecuentes discomóvil",
    "precio DJ boda Barcelona",
    "limitador sonido boda",
    "cancelación evento DJ",
    "equipamiento DJ profesional",
    "alquiler sonido luces Barcelona",
  ],
};

const FAQClient = nextDynamic(() => import("./client"));

export default async function FAQPage() {
  const t = await getTranslations('common');

  return (
    <>
      <Breadcrumbs
        items={[
          { name: t('nav.home'), url: "/" },
          { name: "FAQ", url: "/faq" },
        ]}
      />

      {/* JSON-LD FAQPage - Critical para Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_DATA.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          }),
        }}
      />

      <FAQClient />
    </>
  );
}

