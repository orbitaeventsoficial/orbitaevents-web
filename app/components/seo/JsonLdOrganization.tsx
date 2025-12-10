// app/components/seo/JsonLdOrganization.tsx
import { SITE_CONFIG } from '@/config/site-config';
export default function JsonLdOrganization() {
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Òrbita Events',
    alternateName: 'Orbita Events',
    url: 'https://orbitaevents.com',
    logo: 'https://orbitaeventcom/logo.png',
    image: 'https://orbitaevents.com/og-default.jpg',
    description:
      'Eventos profesionales en Barcelona y Girona: bodas, fiestas privadas, eventos corporativos. DJ profesional, tematización de fiestas y efectos especiales. 2+ años de experiencia.',
    telephone: SITE_CONFIG.business.phone,
    email: SITE_CONFIG.business.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Barcelona',
      addressRegion: 'Catalunya',
      addressCountry: 'ES',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 41.3851,
      longitude: 2.1734,
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Barcelona',
      },
      {
        '@type': 'City',
        name: 'Girona',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Costa Brava',
      },
      {
        '@type': 'AdministrativeArea',
        name: 'Maresme',
      },
    ],
    sameAs: [
      'https://www.instagram.com/orbitaeventsoficial',
      'https://www.facebook.com/orbitaeventsoficial',
      // Añade más perfiles sociales si existen
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE_CONFIG.business.phone,
      contactType: 'Customer Service',
      areaServed: 'ES',
      availableLanguage: ['Spanish', 'Catalan'],
      contactOption: 'TollFree',
    },
    // AggregateRating eliminat - no tenim reviews de Google actives
    priceRange: '€€',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday'],
        opens: '10:00',
        closes: '22:00',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios Òrbita Events',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Bodas',
            description: 'DJ + luces + efectos para bodas épicas',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Discomóvil',
            description: 'DJ profesional + equipamiento para fiestas',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Fiestas Privadas',
            description: 'Cumpleaños, despedidas y fiestas temáticas',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Eventos Corporativos',
            description: 'Team building, cenas empresa, presentaciones',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Producción Técnica',
            description: 'Montaje y operación técnica profesional',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Alquiler Equipamiento',
            description: 'Alquiler sonido, luces y equipamiento DJ',
          },
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
