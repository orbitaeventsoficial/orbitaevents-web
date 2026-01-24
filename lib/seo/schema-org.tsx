// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA.ORG - STRUCTURED DATA COMPLET
// Google entén millor el teu contingut = millor posicionament
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LOCAL BUSINESS - EL MÉS IMPORTANT
// ═══════════════════════════════════════════════════════════════════════════════

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://orbitaevents.com/#organization',
  name: 'Òrbita Events',
  alternateName: ['Orbita Events', 'Òrbita Events Barcelona'],
  description: 'DJ professional per casaments, festes i events corporatius a Barcelona i Girona. Especialistes en tematització Harry Potter i Halloween.',
  url: 'https://orbitaevents.com',
  logo: 'https://orbitaevents.com/img/logoplanetatextdreta.svg',
  image: [
    'https://orbitaevents.com/img/portfolio/bodas/bodas-01.webp',
    'https://orbitaevents.com/img/portfolio/fiestas-privadas/fiestas-privadas-01.webp',
    'https://orbitaevents.com/img/portfolio/fiestas-tematicas-mon-magic/fiestas-tematicas-mon-magic-01.webp',
  ],
  telephone: '+34699121023',
  email: 'info@orbitaevents.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Granollers',
    addressLocality: 'Granollers',
    addressRegion: 'Barcelona',
    postalCode: '08401',
    addressCountry: 'ES',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 41.6079,
    longitude: 2.2876,
  },
  areaServed: [
    {
      '@type': 'State',
      name: 'Barcelona',
      '@id': 'https://en.wikipedia.org/wiki/Province_of_Barcelona',
    },
    {
      '@type': 'State',
      name: 'Girona',
      '@id': 'https://en.wikipedia.org/wiki/Province_of_Girona',
    },
  ],
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer', 'Bizum'],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: '10:00',
      closes: '14:00',
    },
  ],
  // NOTE: aggregateRating removed to fix Google Rich Results error
  // Only add aggregateRating on a dedicated reviews page with linked reviews
  sameAs: [
    'https://www.instagram.com/orbitaevents',
    'https://g.page/orbitaevents',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Serveis d\'events',
    itemListElement: [
      {
        '@type': 'OfferCatalog',
        name: 'DJ Casaments',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'DJ Casament Bàsic',
              description: 'DJ professional per casament amb so i llums LED',
            },
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: '650',
              priceCurrency: 'EUR',
            },
          },
        ],
      },
      {
        '@type': 'OfferCatalog',
        name: 'Discomòbil Festes',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Discomòbil Pack Bàsic',
              description: 'DJ + so + llums per festes privades',
            },
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: '200',
              priceCurrency: 'EUR',
            },
          },
        ],
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SERVICES SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const djCasamentsServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://orbitaevents.com/servicios/bodas#service',
  name: 'DJ Casaments Barcelona',
  description: 'Servei de DJ professional per casaments a Barcelona i Girona. Inclou música personalitzada, coordinació amb fotògrafs, so professional i il·luminació LED.',
  provider: {
    '@type': 'LocalBusiness',
    '@id': 'https://orbitaevents.com/#organization',
  },
  serviceType: 'DJ per casaments',
  areaServed: ['Barcelona', 'Girona'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Packs Casament',
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Casament Bàsic',
        price: '650',
        priceCurrency: 'EUR',
        description: 'DJ 5h + So 2000W + Llums LED',
      },
      {
        '@type': 'Offer',
        name: 'Casament Premium',
        price: '900',
        priceCurrency: 'EUR',
        description: 'DJ 6h + So 4000W + 4 Caps mòbils + Efectes',
      },
      {
        '@type': 'Offer',
        name: 'Casament Champion',
        price: '1200',
        priceCurrency: 'EUR',
        description: 'DJ 8h + Tematització + Tot inclòs',
      },
    ],
  },
};

export const harryPotterServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://orbitaevents.com/experiencies/mon-magic#service',
  name: 'Casament Harry Potter Barcelona - Món Màgic',
  description: 'Experiència de casament temàtic Harry Potter única a Catalunya. Veles flotants, estació de pocions, decoració Hogwarts completa, música temàtica.',
  provider: {
    '@type': 'LocalBusiness',
    '@id': 'https://orbitaevents.com/#organization',
  },
  serviceType: 'Casament temàtic Harry Potter',
  areaServed: ['Barcelona', 'Girona'],
  offers: {
    '@type': 'Offer',
    price: '850',
    priceCurrency: 'EUR',
    priceValidUntil: '2026-12-31',
    availability: 'https://schema.org/InStock',
  },
};

export const halloweenServiceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://orbitaevents.com/experiencies/halloween#service',
  name: 'Festa Halloween Barcelona',
  description: 'Servei complet de festa Halloween a Barcelona. DJ temàtic, decoració terrorífica, màquina de fum, llums i efectes especials.',
  provider: {
    '@type': 'LocalBusiness',
    '@id': 'https://orbitaevents.com/#organization',
  },
  serviceType: 'Festa temàtica Halloween',
  areaServed: ['Barcelona', 'Girona'],
  offers: {
    '@type': 'Offer',
    price: '600',
    priceCurrency: 'EUR',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FAQ SCHEMA - PER LA PÀGINA DE FAQ
// ═══════════════════════════════════════════════════════════════════════════════

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quant costa un DJ per casament a Barcelona?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El preu d\'un DJ per casament a Barcelona amb Òrbita Events comença des de 650€. El pack inclou DJ professional, equip de so, il·luminació LED, muntatge i desmuntatge. Els packs més complets amb tematització arriben fins a 1.800€.',
      },
    },
    {
      '@type': 'Question',
      name: 'Què inclou el servei de discomòbil?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El servei de discomòbil inclou: DJ professional, equip de so (2000W-4000W segons pack), il·luminació LED sincronitzada, efectes especials (fum, làser), muntatge i desmuntatge complet, i transport gratis fins a 25km de Granollers.',
      },
    },
    {
      '@type': 'Question',
      name: 'Feu casaments temàtics Harry Potter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí! Som els únics a Catalunya que oferim servei professional de casament temàtic Harry Potter. Incloem veles flotants, estació de pocions, decoració Hogwarts completa, i música temàtica. Preus des de 850€.',
      },
    },
    {
      '@type': 'Question',
      name: 'A quines zones treballeu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cobrim Barcelona i Girona (província completa). Transport gratis fins a 25km des de Granollers. Per distàncies majors, s\'afegeix un suplement de transport que s\'indica al pressupost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Amb quanta antelació he de reservar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Recomanem: 6-8 setmanes per caps de setmana, 3-4 setmanes per dies laborables. Per tematitzacions complexes (Harry Potter, Halloween), millor 2 mesos. Els dissabtes s\'acaben ràpid!',
      },
    },
    {
      '@type': 'Question',
      name: 'Què passa si alguna cosa falla durant l\'event?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Portem backup COMPLET de tot: controladora extra, portàtil extra, cables duplicats, altaveu de reserva. En +195 events, mai hem hagut de parar un event. Garantia 100%: si falla alguna cosa nostra, et tornem els diners.',
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. REVIEWS SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const reviewsSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://orbitaevents.com/#organization',
  review: [
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Maria i Jordi',
      },
      datePublished: '2024-09-15',
      reviewBody: 'Increïble! Van fer que el nostre casament fos màgic. La tematització Harry Potter va deixar a tots amb la boca oberta. Els convidats encara en parlen!',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
    },
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Laura Martínez',
      },
      datePublished: '2024-10-20',
      reviewBody: 'Contraté la discomòvil i els meus amics AÚN me preguntan dónde encontré al DJ. Los efectos especiales y la puesta en escena fueron espectaculares. Repetiría 100%.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
    },
    {
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: 'Tech Solutions Barcelona',
      },
      datePublished: '2024-12-01',
      reviewBody: 'Necesitábamos un evento corporativo profesional pero divertido. Òrbita nos dió exactamente eso: equipamiento top, coordinación perfecta y una animación que el equipo aún habla.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. BREADCRUMB SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Exemples de breadcrumbs
export const breadcrumbsCasaments = generateBreadcrumbSchema([
  { name: 'Inici', url: 'https://orbitaevents.com' },
  { name: 'Serveis', url: 'https://orbitaevents.com/servicios' },
  { name: 'Casaments', url: 'https://orbitaevents.com/servicios/bodas' },
]);

export const breadcrumbsHalloween = generateBreadcrumbSchema([
  { name: 'Inici', url: 'https://orbitaevents.com' },
  { name: 'Experiències', url: 'https://orbitaevents.com/experiencies' },
  { name: 'Halloween', url: 'https://orbitaevents.com/experiencies/halloween' },
]);

export const breadcrumbsHarryPotter = generateBreadcrumbSchema([
  { name: 'Inici', url: 'https://orbitaevents.com' },
  { name: 'Experiències', url: 'https://orbitaevents.com/experiencies' },
  { name: 'Món Màgic', url: 'https://orbitaevents.com/experiencies/mon-magic' },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// 6. WEBSITE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://orbitaevents.com/#website',
  url: 'https://orbitaevents.com',
  name: 'Òrbita Events',
  description: 'DJ professional per casaments, festes i events a Barcelona i Girona',
  publisher: {
    '@id': 'https://orbitaevents.com/#organization',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://orbitaevents.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: ['ca', 'es'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. HELPER: GENERAR JSON-LD SCRIPT
// ═══════════════════════════════════════════════════════════════════════════════

export function generateJsonLd(schema: object | object[]): string {
  const schemas = Array.isArray(schema) ? schema : [schema];
  return `<script type="application/ld+json">${JSON.stringify(schemas)}</script>`;
}

// Component React per incloure al Head
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
