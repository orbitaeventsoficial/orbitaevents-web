import { SITE_CONFIG } from '@/config/site-config';

/**
 * STRUCTURED DATA (JSON-LD) - SEO BRUTAL
 * Google ama esto - Rich snippets, Knowledge Graph, mejor ranking
 */

export default function StructuredData() {
  // 1. Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EventPlanner',
    name: SITE_CONFIG.business.name,
    legalName: SITE_CONFIG.business.legalName,
    description: 'Creamos experiencias completas personalizadas para eventos en Barcelona y Girona. DJ profesional, tematización, animación, efectos especiales.',
    url: SITE_CONFIG.web.url,
    logo: `${SITE_CONFIG.web.url}${SITE_CONFIG.web.logo}`,
    image: `${SITE_CONFIG.web.url}/og-home.jpg`,
    telephone: SITE_CONFIG.business.phone,
    email: SITE_CONFIG.business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.business.address.street,
      addressLocality: SITE_CONFIG.business.address.city,
      addressRegion: SITE_CONFIG.business.address.region,
      postalCode: SITE_CONFIG.business.address.postalCode,
      addressCountry: SITE_CONFIG.business.address.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.business.coordinates.lat,
      longitude: SITE_CONFIG.business.coordinates.lng,
    },
    areaServed: [
      // Ciudades principales
      { '@type': 'City', name: 'Barcelona' },
      { '@type': 'City', name: 'Girona' },

      // Provincia Barcelona - Interior
      { '@type': 'City', name: 'Granollers' },
      { '@type': 'City', name: 'Sabadell' },
      { '@type': 'City', name: 'Terrassa' },
      { '@type': 'City', name: 'Vic' },

      // Provincia Barcelona - Costa
      { '@type': 'City', name: 'Mataró' },
      { '@type': 'City', name: 'Sitges' },
      { '@type': 'City', name: 'Castelldefels' },
      { '@type': 'City', name: 'Calella' },
      { '@type': 'City', name: 'Vilanova i la Geltrú' },

      // Provincia Girona - Costa
      { '@type': 'City', name: 'Lloret de Mar' },
      { '@type': 'City', name: 'Blanes' },
      { '@type': 'City', name: 'Tossa de Mar' },
      { '@type': 'City', name: 'Platja d\'Aro' },
    ],
    sameAs: [
      SITE_CONFIG.social.instagram.url,
      SITE_CONFIG.social.facebook.url,
      SITE_CONFIG.social.tiktok.url,
    ].filter(Boolean),
    priceRange: '€€',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: SITE_CONFIG.stats.avgRating,
      reviewCount: SITE_CONFIG.stats.reviewCount,
      bestRating: '5',
      worstRating: '1',
    },
  };

  // 2. LocalBusiness Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_CONFIG.business.name,
    image: `${SITE_CONFIG.web.url}/og-home.jpg`,
    '@id': SITE_CONFIG.web.url,
    url: SITE_CONFIG.web.url,
    telephone: SITE_CONFIG.business.phone,
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.business.address.street,
      addressLocality: SITE_CONFIG.business.address.city,
      addressRegion: SITE_CONFIG.business.address.region,
      postalCode: SITE_CONFIG.business.address.postalCode,
      addressCountry: SITE_CONFIG.business.address.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.business.coordinates.lat,
      longitude: SITE_CONFIG.business.coordinates.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '08:00',
        closes: '20:00',
      },
    ],
  };

  // 3. Service Schema
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Event DJ and Entertainment Services',
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.business.name,
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: SITE_CONFIG.business.coordinates.lat,
        longitude: SITE_CONFIG.business.coordinates.lng,
      },
      geoRadius: '50000', // 50km radius
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de DJ y Eventos',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'DJ para Bodas',
            description: 'Servicio completo de DJ, música y animación para bodas con tematización personalizada.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Discomóvil Profesional',
            description: 'Discomóvil con equipamiento profesional, luces LED y efectos especiales.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Eventos Corporativos',
            description: 'Producción técnica completa para eventos de empresa y team building.',
          },
        },
      ],
    },
  };

  // 4. FAQPage Schema - AMPLIAT amb més preguntes per SEO
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué hace diferente a Òrbita de otros DJ/proveedores de eventos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Creamos experiencias completas personalizadas. No solo música: tematización + animación + música adaptada en tiempo real + juegos + efectos. Nuestro DJ lee el ambiente y ajusta sobre la marcha.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto cuesta contratar Òrbita para mi boda/fiesta/evento?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Trabajamos con packs claros desde 250€. Los precios se calculan automáticamente según horas, equipo y tipo de evento en nuestro configurador.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Trabajáis fuera de Barcelona? ¿Cubrís Girona y Costa Brava?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, cubrimos Barcelona provincia y Girona provincia (incluyendo Costa Brava). Transporte GRATIS hasta 25km desde Granollers. Más allá, se añade según distancia.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué equipo de sonido e iluminación utilizáis?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Utilizamos equipos profesionales Pioneer DJ, sistemas de sonido JBL/EV con potencia adaptada al espacio, y cabezas móviles LED con control DMX para efectos sincronizados.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Con cuánta antelación debo reservar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Recomendamos reservar con 2-3 meses de antelación para bodas y eventos grandes. Para fiestas privadas, 2-4 semanas suele ser suficiente. Las fechas populares (sábados de verano) se agotan rápido.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo elegir la música de mi evento?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, te enviamos un formulario previo para conocer tus gustos y peticiones especiales. Durante el evento, nuestro DJ adapta la música en tiempo real según la respuesta del público.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué pasa si hay un problema técnico durante el evento?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Llevamos siempre equipo de backup y un técnico profesional. Tenemos protocolos de contingencia para garantizar que tu evento no se detenga nunca.',
        },
      },
    ],
  };

  // 5. WebSite Schema per SearchBox
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.business.name,
    url: SITE_CONFIG.web.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_CONFIG.web.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* LocalBusiness Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}
