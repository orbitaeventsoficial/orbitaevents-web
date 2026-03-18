import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    booking: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { web: { domain: 'orbitaevents.com' } },
}));

import {
  getCalendarFeedToken,
  regenerateCalendarFeedToken,
  isValidCalendarFeedToken,
  buildCalendarFeedIcs,
} from '@/lib/services/calendarFeedTokenService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findUnique.mockResolvedValue(null);
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.booking.findMany.mockResolvedValue([]);
});

describe('getCalendarFeedToken', () => {
  it('retorna null si no hi ha token', async () => {
    const result = await getCalendarFeedToken();
    expect(result).toBeNull();
  });

  it('retorna token existent', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'my-token-123' });

    const result = await getCalendarFeedToken();
    expect(result).toBe('my-token-123');
  });
});

describe('regenerateCalendarFeedToken', () => {
  it('retorna nou token', async () => {
    const token = await regenerateCalendarFeedToken();

    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(10);
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'integrations.calendar.feedToken' },
      })
    );
  });
});

describe('isValidCalendarFeedToken', () => {
  it('retorna false si no hi ha token', async () => {
    const result = await isValidCalendarFeedToken('any-token');
    expect(result).toBe(false);
  });

  it('retorna false si token no coincideix', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'correct-token' });

    const result = await isValidCalendarFeedToken('wrong-token');
    expect(result).toBe(false);
  });

  it('retorna true si token coincideix', async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: 'correct-token' });

    const result = await isValidCalendarFeedToken('correct-token');
    expect(result).toBe(true);
  });
});

describe('buildCalendarFeedIcs', () => {
  it('retorna ICS vàlid sense reserves', async () => {
    const ics = await buildCalendarFeedIcs();

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('Orbita Events');
  });

  it('inclou reserves com VEVENT', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-1',
        reference: 'OE-2026-ABCD',
        clientName: 'Maria García',
        eventType: 'WEDDING',
        eventDate: new Date('2026-09-15'),
        eventStartTime: '21:00',
        eventEndTime: '04:00',
        eventLocation: 'Barcelona',
        eventVenue: 'Hotel Arts',
        status: 'CONFIRMED',
        notes: 'VIP',
        updatedAt: new Date('2026-03-01'),
      },
    ]);

    const ics = await buildCalendarFeedIcs();

    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('OE-2026-ABCD');
    expect(ics).toContain('Maria García');
    expect(ics).toContain('Hotel Arts - Barcelona');
    expect(ics).toContain('booking-1@orbitaevents.com');
  });

  it('escapa caràcters especials ICS', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-2',
        reference: 'OE-2026-TEST',
        clientName: 'Joan, el magnífic',
        eventType: 'BIRTHDAY',
        eventDate: new Date('2026-10-01'),
        eventStartTime: '20:00',
        eventEndTime: '02:00',
        eventLocation: 'Girona; centre',
        eventVenue: null,
        status: 'PENDING',
        notes: null,
        updatedAt: new Date('2026-03-01'),
      },
    ]);

    const ics = await buildCalendarFeedIcs();

    // Commas and semicolons should be escaped
    expect(ics).toContain('Joan\\, el magnífic');
    expect(ics).toContain('Girona\\; centre');
  });
});
