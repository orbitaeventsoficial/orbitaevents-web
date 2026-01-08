import Script from 'next/script';

interface ServiceSchemaProps {
  name: string;
  description: string;
  serviceType: string;
  price?: string;
  priceCurrency?: string;
  areaServed?: string[];
  image?: string;
  url?: string;
}

export function ServiceSchema({
  name,
  description,
  serviceType,
  price,
  priceCurrency = 'EUR',
  areaServed = ['Barcelona', 'Girona', 'Cataluña'],
  image,
  url,
}: ServiceSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': url ? `${url}#service` : undefined,
    name,
    description,
    serviceType,
    provider: {
      '@id': 'https://orbitaevents.com/#organization',
    },
    areaServed: areaServed.map((area) => ({
      '@type': 'City',
      name: area,
    })),
    ...(price && {
      offers: {
        '@type': 'Offer',
        price,
        priceCurrency,
        availability: 'https://schema.org/InStock',
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ).toISOString(),
      },
    }),
    ...(image && { image }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `Packs de ${name}`,
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: `Pack Básico - ${name}`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: `Pack Premium - ${name}`,
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: `Pack VIP - ${name}`,
          },
        },
      ],
    },
  };

  return (
    <Script
      id="service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
