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
  averageRating,
  reviewCount,
}: ReviewSchemaProps) {
  const calculatedAverage =
    averageRating ||
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const calculatedCount = reviewCount || reviews.length;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://orbitaevents.com/#organization',
    name: itemName,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: calculatedAverage.toFixed(1),
      reviewCount: calculatedCount,
      bestRating: '5',
      worstRating: '1',
    },
    review: reviews.slice(0, 10).map((review) => ({
      '@type': 'Review',
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
    })),
  };

  return (
    <Script
      id="review-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
