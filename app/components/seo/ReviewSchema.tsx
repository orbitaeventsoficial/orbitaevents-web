import Script from 'next/script';

interface Review {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}

interface ReviewSchemaProps {
  reviews: Review[];
  itemName?: string;
  averageRating?: number;
  reviewCount?: number;
}

export function ReviewSchema({
  reviews,
  itemName = 'Òrbita Events',
}: ReviewSchemaProps) {
  // Only output individual Review schemas that reference the organization
  // LocalBusiness is already defined in layout.tsx - don't duplicate it
  const schema = reviews.slice(0, 10).map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'LocalBusiness',
      '@id': 'https://orbitaevents.com/#organization',
      name: itemName,
    },
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.datePublished,
    reviewBody: review.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
  }));

  return (
    <Script
      id="review-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
