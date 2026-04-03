// app/components/seo/ServiceJsonLD.tsx
// 🔥 MANOLO VERSION - Optimizado para conversión SEO
import { SITE_CONFIG } from '@/app/config/site-config';
import { absoluteUrl, getSiteUrl } from '@/lib/site';
import { getManagedImageOverride } from '@/lib/services/imageManagerService';

type AggregateRating = {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
};

type CustomOffer = {
  '@type': 'Offer';
  name?: string;
  price: string;
  priceCurrency?: string;
  description?: string;
  availability?: string;
  url?: string;
};

interface Props {
  name: string;
  slugPath: string;
  description: string;
  serviceType: string[];
  areaServed: string[];
  priceFrom?: string;
  priceCurrency?: string;
  availability?: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
  offers?: CustomOffer[];
}

export default async function ServiceJsonLD({
  name,
  slugPath,
  description,
  serviceType,
  areaServed,
  priceFrom,
  priceCurrency = 'EUR',
  availability = 'https://schema.org/InStock',
  aggregateRating,
  offers,
}: Props) {
  const base = getSiteUrl();
  const url = `${base}${slugPath}`;
  const managedHeaderLogo = await getManagedImageOverride('layout.logo.header');
  const providerLogoUrl = absoluteUrl(managedHeaderLogo?.src || SITE_CONFIG.web.logo, base);

  const offersData = offers && offers.length > 0
    ? offers.map((offer) => ({
        '@type': 'Offer' as const,
        name: offer.name,
        price: offer.price,
        priceCurrency: offer.priceCurrency || priceCurrency,
        description: offer.description,
        availability: offer.availability || availability,
        url: offer.url || url,
        seller: { '@type': 'Organization' as const, name: SITE_CONFIG.business.name },
      }))
    : {
        '@type': 'Offer' as const,
        url,
        priceCurrency,
        ...(priceFrom ? { price: priceFrom } : {}),
        availability,
        seller: { '@type': 'Organization' as const, name: SITE_CONFIG.business.name },
      };

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType: Array.isArray(serviceType) ? serviceType[0] : serviceType,
    category: Array.isArray(serviceType) ? serviceType.join(', ') : serviceType,
    url,
    image: `${base}/api/og?title=${encodeURIComponent(name)}`,
    areaServed: areaServed.map((a) => ({ '@type': 'AdministrativeArea', name: a })),
    offers: offersData,
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.business.name,
      url: base,
      logo: providerLogoUrl,
      sameAs: Object.values(SITE_CONFIG.social.urls),
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: SITE_CONFIG.business.phone,
        contactType: 'customer service',
        email: SITE_CONFIG.business.email,
        availableLanguage: ['Spanish', 'Catalan'],
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE_CONFIG.business.address.street,
        addressLocality: SITE_CONFIG.business.address.city,
        addressRegion: SITE_CONFIG.business.address.region,
        postalCode: SITE_CONFIG.business.address.postalCode,
        addressCountry: SITE_CONFIG.business.address.countryCode,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: SITE_CONFIG.business.hours.weekdays.open,
          closes: SITE_CONFIG.business.hours.weekdays.close,
        },
      ],
    },
    ...(aggregateRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: aggregateRating.ratingValue,
            reviewCount: aggregateRating.reviewCount,
            bestRating: 5,
            worstRating: 1,
          } as AggregateRating,
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
