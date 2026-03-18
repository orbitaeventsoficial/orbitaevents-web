import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findMany: vi.fn() },
    liveNotification: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { listRecentBookingsFeed } from '@/lib/services/recentBookingsService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.liveNotification.findMany.mockResolvedValue([]);
});

describe('listRecentBookingsFeed', () => {
  it('retorna array buit si no hi ha reserves ni notificacions', async () => {
    const result = await listRecentBookingsFeed();
    expect(result.bookings).toEqual([]);
  });

  it('retorna reserves reals amb nom anonimitzat', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'b1',
        clientName: 'Maria Garcia',
        eventType: 'WEDDING',
        eventLocation: 'Barcelona, Catalunya',
        createdAt: new Date(),
      },
    ]);

    const result = await listRecentBookingsFeed();

    expect(result.bookings).toHaveLength(1);
    expect(result.bookings[0].name).toBe('Maria G.');
    expect(result.bookings[0].city).toBe('Barcelona');
    expect(result.bookings[0].icon).toBe('heart');
    expect(result.bookings[0].isReal).toBe(true);
  });

  it('extreu ciutat de localitzacions conegudes', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      { id: 'b1', clientName: 'Test User', eventType: 'BIRTHDAY', eventLocation: 'Masia a Granollers', createdAt: new Date() },
    ]);

    const result = await listRecentBookingsFeed();
    expect(result.bookings[0].city).toBe('Granollers');
  });

  it('retorna Catalunya si no hi ha localització', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      { id: 'b1', clientName: 'Test', eventType: 'OTHER', eventLocation: '', createdAt: new Date() },
    ]);

    const result = await listRecentBookingsFeed();
    expect(result.bookings[0].city).toBe('Catalunya');
  });

  it('anonimitza noms amb un sol mot', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      { id: 'b1', clientName: 'Madonna', eventType: 'CORPORATE', eventLocation: 'BCN', createdAt: new Date() },
    ]);

    const result = await listRecentBookingsFeed();
    expect(result.bookings[0].name).toBe('Madonna');
  });

  it('fa fallback a liveNotifications si no hi ha reserves', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.liveNotification.findMany.mockResolvedValue([
      { id: 'ln1', type: 'WEDDING', location: 'Girona', createdAt: new Date(), isReal: false, expiresAt: new Date(Date.now() + 10000) },
    ]);

    const result = await listRecentBookingsFeed();

    expect(result.bookings).toHaveLength(1);
    expect(result.bookings[0].isReal).toBe(false);
    expect(result.bookings[0].city).toBe('Girona');
  });

  it('mapeja icones correctament per tipus', async () => {
    const types = [
      { type: 'WEDDING', icon: 'heart' },
      { type: 'BIRTHDAY', icon: 'sparkles' },
      { type: 'CORPORATE', icon: 'building' },
      { type: 'OTHER', icon: 'check' },
    ];

    for (const { type, icon } of types) {
      mockPrisma.booking.findMany.mockResolvedValue([
        { id: `b-${type}`, clientName: 'Test User', eventType: type, eventLocation: 'BCN', createdAt: new Date() },
      ]);

      const result = await listRecentBookingsFeed();
      expect(result.bookings[0].icon).toBe(icon);
    }
  });

  it('mostra "Ara mateix" per reserves molt recents', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      { id: 'b1', clientName: 'Test User', eventType: 'BIRTHDAY', eventLocation: 'BCN', createdAt: new Date() },
    ]);

    const result = await listRecentBookingsFeed();
    expect(result.bookings[0].timeAgo).toBe('Ara mateix');
  });
});
