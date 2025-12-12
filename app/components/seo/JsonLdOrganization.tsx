// app/components/seo/JsonLdOrganization.tsx
import { SITE_CONFIG } from '@/config/site-config';
import { getTranslations } from 'next-intl/server';

interface Props {
  locale: string;
}

export default async function JsonLdOrganization({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'seoJsonLd' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Òrbita Events',
    alternateName: 'Orbita Events',
    url: 'https://orbitaevents.com',
    logo: 'https://orbitaevents.com/logo.png',
    image: 'https://orbitaevents.com/og-default.jpg',
    description: t('organization.description'),
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
      { '@type': 'City', name: 'Barcelona' },
      { '@type': 'City', name: 'Girona' },
      { '@type': 'AdministrativeArea', name: 'Costa Brava' },
      { '@type': 'AdministrativeArea', name: 'Maresme' },
    ],
    sameAs: [
      'https://www.instagram.com/orbitaeventsoficial',
      'https://www.facebook.com/orbitaeventsoficial',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE_CONFIG.business.phone,
      contactType: 'Customer Service',
      areaServed: 'ES',
      availableLanguage: ['Spanish', 'Catalan'],
      contactOption: 'TollFree',
    },
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
            name: t('services.bodas.name'),
            description: t('services.bodas.description'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: t('services.discomovil.name'),
            description: t('services.discomovil.description'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: t('services.fiestas.name'),
            description: t('services.fiestas.description'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: t('services.corporativo.name'),
            description: t('services.corporativo.description'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: t('services.produccion.name'),
            description: t('services.produccion.description'),
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: t('services.alquiler.name'),
            description: t('services.alquiler.description'),
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
