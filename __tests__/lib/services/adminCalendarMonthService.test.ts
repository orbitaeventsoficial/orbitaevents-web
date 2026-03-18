import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findMany: vi.fn() },
    availability: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { getAdminCalendarMonth } from '@/lib/services/adminCalendarMonthService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.availability.findMany.mockResolvedValue([]);
});

describe('getAdminCalendarMonth', () => {
  it('retorna 400 sense from o to', async () => {
    expect((await getAdminCalendarMonth(null, null)).status).toBe(400);
    expect((await getAdminCalendarMonth('2026-03-01', null)).status).toBe(400);
    expect((await getAdminCalendarMonth(null, '2026-03-31')).status).toBe(400);
  });

  it('retorna dies del rang', async () => {
    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-03');

    expect(result.status).toBe(200);
    const days = result.body.days!;
    expect(days['2026-03-01']).toBeDefined();
    expect(days['2026-03-02']).toBeDefined();
    expect(days['2026-03-03']).toBeDefined();
  });

  it('associa reserves al dia correcte', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'b1',
        leadId: 'l1',
        customerId: 'c1',
        eventDate: new Date('2026-03-15T12:00:00Z'),
        clientName: 'Test Client',
        eventLocation: 'Barcelona',
        eventVenue: null,
        status: 'CONFIRMED',
        eventType: 'WEDDING',
        total: 2000,
        eventStartTime: '20:00',
        eventEndTime: '04:00',
        pack: { slug: 'premium', translations: [{ locale: 'ca', name: 'Premium' }] },
      },
    ]);

    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-31');

    const day15 = result.body.days!['2026-03-15'];
    expect(day15.reservas).toHaveLength(1);
    expect(day15.reservas[0].clientName).toBe('Test Client');
    expect(day15.reservas[0].packName).toBe('Premium');
  });

  it('associa bloqueigs al dia correcte', async () => {
    mockPrisma.availability.findMany.mockResolvedValue([
      { id: 'av1', date: new Date('2026-03-20T12:00:00Z'), note: 'Festiu' },
    ]);

    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-31');

    const day20 = result.body.days!['2026-03-20'];
    expect(day20.bloqueos).toHaveLength(1);
    expect(day20.bloqueos[0].notas).toBe('Festiu');
  });

  it('usa fallback slug si no hi ha traducció', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'b2',
        leadId: null,
        customerId: null,
        eventDate: new Date('2026-03-10T12:00:00Z'),
        clientName: 'Client',
        eventLocation: null,
        eventVenue: null,
        status: 'PENDING',
        eventType: 'OTHER',
        total: 500,
        eventStartTime: null,
        eventEndTime: null,
        pack: { slug: 'basic', translations: [] },
      },
    ]);

    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-31');

    expect(result.body.days!['2026-03-10'].reservas[0].packName).toBe('basic');
  });
});
