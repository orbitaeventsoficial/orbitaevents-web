import { describe, expect, it } from 'vitest';
import { buildPublicBookingRequestEmail } from '@/lib/email';

const BASE_BOOKING = {
  id: 'booking-1',
  reference: 'OE-2026-001',
  preferredLocale: 'ca',
  eventDate: new Date('2026-09-15T00:00:00.000Z'),
  eventStartTime: '18:00',
  eventEndTime: '02:00',
  eventLocation: 'Barcelona',
  eventVenue: 'Masia Test',
  guestCount: 80,
  clientName: 'Maria López',
  clientEmail: 'maria@example.com',
  clientPhone: '+34699111222',
  eventType: 'BIRTHDAY',
  total: 605,
  extraHours: 1,
  notes: null,
  pack: {
    slug: 'pack-zen',
    price: 500,
    extraHourPrice: 90,
    translations: [
      { locale: 'ca', name: 'Pack Zen' },
      { locale: 'es', name: 'Pack Zen ES' },
      { locale: 'en', name: 'Zen Pack' },
    ],
  },
  extras: [
    {
      price: 50,
      extra: {
        slug: 'karaoke',
        translations: [
          { locale: 'ca', name: 'Karaoke' },
          { locale: 'es', name: 'Karaoke ES' },
          { locale: 'en', name: 'Karaoke EN' },
        ],
      },
    },
  ],
};

describe('buildPublicBookingRequestEmail', () => {
  it('presenta la reserva pública com a sol·licitud pendent, no com a confirmació final', () => {
    const email = buildPublicBookingRequestEmail(BASE_BOOKING);

    expect(email.subject).toBe('Sol·licitud de reserva rebuda #OE-2026-001 - Òrbita Events');
    expect(email.html).toContain('Sol·licitud de reserva rebuda');
    expect(email.html).toContain('bloquejada provisionalment');
    expect(email.html).toContain('Pack Zen');
    expect(email.html).toContain('Karaoke');
    expect(email.html).not.toContain('Reserva Confirmada');
    expect(email.html).not.toContain('Tu reserva ha sido confirmada');
  });

  it('localitza el correu segons preferredLocale', () => {
    const email = buildPublicBookingRequestEmail({
      ...BASE_BOOKING,
      preferredLocale: 'en',
    });

    expect(email.subject).toBe('Booking request received #OE-2026-001 - Orbita Events');
    expect(email.html).toContain('Booking request received');
    expect(email.html).toContain('provisionally blocked');
    expect(email.html).toContain('Zen Pack');
    expect(email.html).not.toContain('Booking confirmed');
  });
});
