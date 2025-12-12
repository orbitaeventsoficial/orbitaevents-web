import { SITE_CONFIG } from '@/config/site-config';
import { getTranslations } from 'next-intl/server';

/**
 * STRUCTURED DATA (JSON-LD) - SEO BRUTAL
 * Google ama esto - Rich snippets, Knowledge Graph, mejor ranking
 */

interface Props {
  locale: string;
}

export default async function StructuredData({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'structuredData' });

  // 1. Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EventPlanner',
    name: SITE_CONFIG.business.name,
    legalName: SITE_CONFIG.business.legalName,
    description: t('organization.description'),
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
      name: t('service.catalogName'),
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: t('service.djWeddings'),
            description: t('service.djWeddingsDesc'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: t('service.discomovil'),
            description: t('service.discomovilDesc'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: t('service.corporate'),
            description: t('service.corporateDesc'),
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
        name: t('faq.q1'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a1'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.q2'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a2'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.q3'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a3'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.q4'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a4'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.q5'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a5'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.q6'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a6'),
        },
      },
      {
        '@type': 'Question',
        name: t('faq.q7'),
        acceptedAnswer: {
          '@type': 'Answer',
          text: t('faq.a7'),
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
