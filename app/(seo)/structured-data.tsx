"use client";
import { useMemo } from "react";

export default function StructuredData() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    "https://orbitaevents-prova.vercel.app";
  const siteSearchTarget = `${base}/buscar?q={search_term_string}`;

  const payload = useMemo(() => {
    const graph = [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "Òrbita Events",
        url: base,
        logo: `${base}/img/brand/logo.png`,
        image: `${base}/img/brand/og-square.png`,
        sameAs: [
          "https://www.instagram.com/orbitaeventsoficial",
          "https://www.facebook.com/orbitaeventsoficial",
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "${SITE_CONFIG.business.phone}",
            contactType: "customer service",
            areaServed: "ES",
            availableLanguage: ["es", "ca", "en"],
          },
        ],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${base}/#localbusiness`,
        name: "Òrbita Events",
        url: base,
        image: `${base}/img/brand/og-square.png`,
        telephone: "${SITE_CONFIG.business.phone}",
        email: "${SITE_CONFIG.business.email}",
        priceRange: "€€",
        areaServed: ["ES-CN", "ES-B", "ES"],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Barcelona",
          addressRegion: "Catalunya",
          addressCountry: "ES",
        },
        knowsAbout: [
          "DJ",
          "discomóvil",
          "sonido para eventos",
          "iluminación para eventos",
          "producción técnica",
          "bodas",
          "eventos corporativos",
          "tematización",
          "fiestas temáticas de magia",
          "Halloween",
          "Navidad",
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Servicios",
          itemListElement: [
            {
              "@type": "OfferCatalog",
              name: "Música y DJ",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: "Discomóvil / DJ" },
                },
              ],
            },
            {
              "@type": "OfferCatalog",
              name: "Técnica",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: "Sonido profesional" },
                },
                {
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: "Iluminación" },
                },
                {
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: "Producción técnica" },
                },{
                  "@type": "Offer",
                  itemOffered: { "@type": "Service", name: "Tematización" },
                },
              ],
            },
          ],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: "Òrbita Events",
        inLanguage: "es-ES",
        publisher: { "@id": `${base}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: siteSearchTarget,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "WebPage",
        "@id": `${base}/#webpage`,
        url: base,
        name: "Inicio",
        isPartOf: { "@id": `${base}/#website` },
        about: { "@id": `${base}/#localbusiness` },
        inLanguage: "es-ES",
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `${base}/img/brand/og-square.png`,
        },
      },
    ];

    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  }, [base, siteSearchTarget]);

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
