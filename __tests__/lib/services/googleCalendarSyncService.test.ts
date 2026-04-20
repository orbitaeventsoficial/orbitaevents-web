import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findUnique: vi.fn() },
    setting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    adminLog: { create: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/constants', () => ({
  formatCurrency: (v: number) => `${v.toFixed(2)} €`,
}));

import { syncBookingToGoogleCalendar } from '@/lib/services/googleCalendarSyncService';

const originalFetch = globalThis.fetch;

const mockBooking = {
  id: 'b1',
  reference: 'ORB-001',
  clientName: 'Test Client',
  clientEmail: 'test@test.com',
  clientPhone: '600123456',
  eventType: 'WEDDING',
  eventDate: new Date('2026-06-15'),
  eventStartTime: '20:00',
  eventEndTime: '04:00',
  eventLocation: 'Barcelona',
  eventVenue: 'Sala Gran',
  notes: 'Notes test',
  status: 'CONFIRMED',
  total: 2000,
  depositPaid: true,
  remainingPaid: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.setting.deleteMany.mockResolvedValue({});
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe('syncBookingToGoogleCalendar', () => {
  it('retorna error si reserva no existeix', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const result = await syncBookingToGoogleCalendar('nonexist');

    expect(result.ok).toBe(false);
    expect(result.status).toBe('error');
    expect(result.error).toContain('no trobada');
  });

  it('retorna skipped si estat no sincronitzable (PENDING)', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...mockBooking, status: 'PENDING' });

    const result = await syncBookingToGoogleCalendar('b1');

    expect(result.ok).toBe(true);
    expect(result.status).toBe('skipped');
  });

  it('retorna skipped si no hi ha refresh token', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
    mockPrisma.setting.findMany.mockResolvedValue([]); // no refresh token

    const result = await syncBookingToGoogleCalendar('b1');

    expect(result.ok).toBe(true);
    expect(result.status).toBe('skipped');
    expect(result.reason).toContain('no conectado');
  });

  it('sincronitza reserva CONFIRMED (upsert)', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'integrations.googleCalendar.refreshToken', value: 'rt123' },
      { key: 'integrations.googleCalendar.calendarId', value: 'cal1' },
    ]);

    // Token refresh
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'at123' }),
      })
      // Calendar POST
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'gcal-event-1' }),
      });

    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';

    const result = await syncBookingToGoogleCalendar('b1');

    expect(result.ok).toBe(true);
    expect(result.status).toBe('synced');
    expect(result.eventId).toBe('gcal-event-1');
    expect(mockPrisma.setting.upsert).toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalled();

    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  });

  it('inclou alarmes pròpies al payload de l\'event', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'integrations.googleCalendar.refreshToken', value: 'rt123' },
      { key: 'integrations.googleCalendar.calendarId', value: 'cal1' },
    ]);

    let capturedPayload: Record<string, unknown> | undefined;
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'at123' }),
      })
      .mockImplementationOnce((_url, init) => {
        capturedPayload = JSON.parse(String((init as RequestInit).body));
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'gcal-event-2' }),
        });
      });

    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';

    await syncBookingToGoogleCalendar('b1');

    expect(capturedPayload).toBeDefined();
    const reminders = capturedPayload!.reminders as { useDefault: boolean; overrides: Array<{ method: string; minutes: number }> };
    expect(reminders.useDefault).toBe(false);
    expect(reminders.overrides).toHaveLength(4);
    expect(reminders.overrides[0]).toEqual({ method: 'popup', minutes: 7 * 24 * 60 });
    expect(reminders.overrides[1]).toEqual({ method: 'popup', minutes: 24 * 60 });
    expect(reminders.overrides[2]).toEqual({ method: 'email', minutes: 24 * 60 });
    expect(reminders.overrides[3]).toEqual({ method: 'popup', minutes: 2 * 60 });

    // Descripció inclou resum d'alarmes
    expect(capturedPayload!.description).toContain('Alarmes:');

    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  });

  it('elimina event del calendari per reserva CANCELLED', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...mockBooking, status: 'CANCELLED' });
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'integrations.googleCalendar.refreshToken', value: 'rt123' },
      { key: 'integrations.googleCalendar.bookingEvent.b1', value: 'gcal-old' },
    ]);

    // Token refresh
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'at123' }),
      })
      // Calendar DELETE
      .mockResolvedValueOnce({ ok: true, status: 204 });

    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';

    const result = await syncBookingToGoogleCalendar('b1');

    expect(result.ok).toBe(true);
    expect(result.status).toBe('deleted');
    expect(mockPrisma.setting.deleteMany).toHaveBeenCalled();

    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  });

  it('retorna error si falla token refresh', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'integrations.googleCalendar.refreshToken', value: 'rt123' },
    ]);

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve('invalid_token'),
    });

    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';

    const result = await syncBookingToGoogleCalendar('b1');

    expect(result.ok).toBe(false);
    expect(result.status).toBe('error');

    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  });

  it('accepta forcedAction override', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...mockBooking, status: 'PENDING' });
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'integrations.googleCalendar.refreshToken', value: 'rt123' },
    ]);

    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'at' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'e1' }),
      });

    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';

    const result = await syncBookingToGoogleCalendar('b1', 'upsert');

    expect(result.ok).toBe(true);
    expect(result.status).toBe('synced');

    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  });
});
