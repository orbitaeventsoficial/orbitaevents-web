import Script from 'next/script';

interface EventSchemaProps {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address?: string;
    city?: string;
  };
  image?: string;
  performer?: string;
  eventStatus?: 'EventScheduled' | 'EventCancelled' | 'EventPostponed';
}

export function EventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  performer = 'Òrbita Events',
  eventStatus = 'EventScheduled',
}: EventSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    ...(endDate && { endDate }),
    eventStatus: `https://schema.org/${eventStatus}`,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: location.name,
      ...(location.address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: location.address,
          addressLocality: location.city || 'Barcelona',
          addressRegion: 'Cataluña',
          addressCountry: 'ES',
        },
      }),
    },
    ...(image && { image: [image] }),
    performer: {
      '@type': 'PerformingGroup',
      name: performer,
    },
    organizer: {
      '@type': 'Organization',
      '@id': 'https://orbitaevents.com/#organization',
      name: 'Òrbita Events',
      url: 'https://orbitaevents.com',
    },
  };

  return (
    <Script
      id="event-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
