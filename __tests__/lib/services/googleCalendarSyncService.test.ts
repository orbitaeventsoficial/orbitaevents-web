import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findUnique: vi.fn(), findMany: vi.fn() },
    lead: { findMany: vi.fn() },
    task: { findMany: vi.fn() },
    availability: { findMany: vi.fn() },
    socialPost: { findMany: vi.fn() },
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

import { reconcileGoogleCalendar, syncBookingToGoogleCalendar } from '@/lib/services/googleCalendarSyncService';

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
  cashAmount: null,
  depositPaid: true,
  remainingPaid: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockPrisma.setting.upsert.mockResolvedValue({});
  mockPrisma.setting.deleteMany.mockResolvedValue({});
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.availability.findMany.mockResolvedValue([]);
  mockPrisma.socialPost.findMany.mockResolvedValue([]);
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

  it('retorna skipped si estat no sincronitzable', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ ...mockBooking, status: 'UNKNOWN' });

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

  it('marca cobrament complet al calendari si cashAmount cobreix el total', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      ...mockBooking,
      depositPaid: false,
      remainingPaid: false,
      cashAmount: 2000,
    });
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
          json: () => Promise.resolve({ id: 'gcal-event-cash' }),
        });
      });

    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';

    await syncBookingToGoogleCalendar('b1');

    expect(capturedPayload?.description).toContain('Cobrament: Pagament complet');

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

describe('reconcileGoogleCalendar', () => {
  it('informa tots els elements pendents quan falta connexió OAuth', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([{ id: 'b1' }, { id: 'b2' }]);
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 'l1' }]);
    mockPrisma.task.findMany.mockResolvedValue([{ id: 't1' }]);
    mockPrisma.availability.findMany.mockResolvedValue([{ id: 'a1' }]);

    const result = await reconcileGoogleCalendar();

    expect(result).toEqual({
      connected: false,
      desired: 5,
      synced: 0,
      deleted: 0,
      failed: 0,
      skipped: 5,
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('sincronitza en una passada reserves, leads, tasques, bloquejos i social', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'integrations.googleCalendar.refreshToken', value: 'rt123' },
      { key: 'integrations.googleCalendar.calendarId', value: 'cal1' },
    ]);
    mockPrisma.booking.findMany.mockResolvedValue([mockBooking]);
    mockPrisma.lead.findMany.mockResolvedValue([{
      id: 'l1',
      name: 'Lead futur',
      email: 'lead@test.com',
      phone: '600000000',
      eventType: 'WEDDING',
      eventDate: new Date('2026-07-01'),
      eventStartTime: null,
      eventEndTime: null,
      eventLocation: 'Girona',
      status: 'NEW',
      priority: 'HIGH',
    }]);
    mockPrisma.task.findMany.mockResolvedValue([{
      id: 't1',
      title: 'Preparar equip',
      description: 'Revisar cablejat',
      dueDate: new Date('2026-06-10'),
      status: 'OPEN',
      priority: 'URGENT',
    }]);
    mockPrisma.availability.findMany.mockResolvedValue([{
      id: 'a1',
      date: new Date('2026-08-01'),
      note: 'Vacances',
    }]);
    mockPrisma.socialPost.findMany.mockResolvedValue([{
      id: 's1',
      title: 'Publicació',
      platforms: ['INSTAGRAM'],
      contentType: 'REEL',
      status: 'SCHEDULED',
      scheduledAt: new Date('2026-06-20T10:00:00Z'),
      notes: null,
    }]);

    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'at123' }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 'event-id' }) });

    const result = await reconcileGoogleCalendar();

    expect(result).toEqual({
      connected: true,
      desired: 5,
      synced: 5,
      deleted: 0,
      failed: 0,
      skipped: 0,
    });
    expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(5);
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: {
        action: 'CALENDAR_RECONCILE',
        entity: 'system',
        details: result,
      },
    });

    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  });

  it('elimina de Google els mappings que ja no existeixen al calendari operatiu', async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'integrations.googleCalendar.refreshToken', value: 'rt123' },
      { key: 'integrations.googleCalendar.calendarId', value: 'cal1' },
      { key: 'integrations.googleCalendar.taskEvent.old-task', value: 'old-event' },
    ]);
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-id';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-secret';
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'at123' }) })
      .mockResolvedValueOnce({ ok: true, status: 204 });

    const result = await reconcileGoogleCalendar();

    expect(result.deleted).toBe(1);
    expect(mockPrisma.setting.deleteMany).toHaveBeenCalledWith({
      where: { key: 'integrations.googleCalendar.taskEvent.old-task' },
    });

    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  });
});
