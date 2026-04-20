import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequestId, mockLog, mockListPending, mockSendEmail, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
  mockListPending: vi.fn(),
  mockSendEmail: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/postEventDispatchService', () => ({
  listPendingPostEventBookings: mockListPending,
  sendPostEventEmailForBooking: mockSendEmail,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/post-event/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/post-event', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

const bookings = [
  { id: 'b1', clientName: 'Anna', clientEmail: 'anna@test.cat' },
  { id: 'b2', clientName: 'Marc', clientEmail: 'marc@test.cat' },
];

describe('GET /api/cron/post-event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-postevent');
    mockListPending.mockResolvedValue(bookings);
    mockSendEmail.mockImplementation(async (id: string) => ({
      bookingId: id,
      clientName: id === 'b1' ? 'Anna' : 'Marc',
      email: id === 'b1' ? 'anna@test.cat' : 'marc@test.cat',
      status: 'sent',
    }));
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(mockListPending).not.toHaveBeenCalled();
  });

  it('rebutja Bearer token incorrecte', async () => {
    const res = await GET(makeRequest('wrong'));
    expect(res.status).toBe(401);
  });

  it('processa bookings i retorna summary', async () => {
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary.processed).toBe(2);
    expect(body.summary.sent).toBe(2);
    expect(body.results).toHaveLength(2);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.postEvent', status: 'ok' })
    );
  });

  it('retorna summary buit si no hi ha bookings pendents', async () => {
    mockListPending.mockResolvedValueOnce([]);
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary.processed).toBe(0);
    expect(body.results).toHaveLength(0);
  });

  it('gestiona errors individuals per booking', async () => {
    mockSendEmail.mockImplementation(async (id: string) => {
      if (id === 'b2') throw new Error('SMTP fail');
      return { bookingId: id, clientName: 'Anna', email: 'anna@test.cat', status: 'sent' };
    });
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.sent).toBe(1);
    expect(body.summary.errors).toBe(1);
  });

  it('guarda status error si falla globalment', async () => {
    mockListPending.mockRejectedValueOnce(new Error('DB crash'));
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Error processant esdeveniments');
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.postEvent', status: 'error', message: 'DB crash' })
    );
  });
});
