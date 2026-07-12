import { describe, expect, it } from 'vitest';
import {
  generateDeliveryNotePdfBuffer,
  normalizeDeliveryNotePdfSnapshot,
} from '@/lib/services/deliveryNotePdfService';

describe('normalizeDeliveryNotePdfSnapshot', () => {
  it('normalitza snapshot congelat de l’albarà sense inventar imports', () => {
    const snapshot = normalizeDeliveryNotePdfSnapshot({
      bookingReference: 'OE-2026-0001',
      client: { name: 'Cristina' },
      event: {
        date: '2026-07-20T00:00:00.000Z',
        location: 'Cornellà',
        venue: 'Sala',
        startTime: '20:00',
        endTime: '22:00',
        guestCount: 96,
      },
      items: [
        { type: 'PACK', label: 'Pack DJ', quantity: 1 },
        { type: 'SERVICE_LINE', label: 'Bingo Musical', quantity: 1 },
        { type: 'SERVICE_LINE', label: '', quantity: 1 },
      ],
    });

    expect(snapshot).toMatchObject({
      bookingReference: 'OE-2026-0001',
      clientName: 'Cristina',
      eventLocation: 'Cornellà',
      eventVenue: 'Sala',
      guestCount: 96,
    });
    expect(snapshot.items).toEqual([
      { type: 'PACK', label: 'Pack DJ', quantity: 1 },
      { type: 'SERVICE_LINE', label: 'Bingo Musical', quantity: 1 },
    ]);
  });
});

describe('generateDeliveryNotePdfBuffer', () => {
  it('renderitza un PDF binari d’albarà', async () => {
    const buffer = await generateDeliveryNotePdfBuffer({
      reference: 'ALB-2026-0001',
      status: 'SIGNED',
      createdAt: '2026-07-20T10:00:00.000Z',
      deliveredAt: '2026-07-20T20:00:00.000Z',
      signedAt: '2026-07-20T22:00:00.000Z',
      signedBy: 'Cristina',
      snapshot: {
        bookingReference: 'OE-2026-0001',
        client: { name: 'Cristina' },
        event: { date: '2026-07-20T00:00:00.000Z', location: 'Cornellà' },
        items: [{ type: 'PACK', label: 'Pack DJ', quantity: 1 }],
      },
    });

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
