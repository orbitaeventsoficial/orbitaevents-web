import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockListPending, mockSendEmail, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockListPending: vi.fn(),
  mockSendEmail: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/postEventDispatchService', () => ({
  listPendingPostEventBookings: mockListPending,
  sendPostEventEmailForBooking: mockSendEmail,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({ saveCronRunStatus: mockSaveCronRunStatus }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { POST } from '@/app/api/admin/emails/run-cron/route';

describe('POST /api/admin/emails/run-cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockListPending.mockResolvedValue([
      { id: 'b1', clientName: 'Anna', clientEmail: 'anna@test.cat' },
    ]);
    mockSendEmail.mockResolvedValue({ bookingId: 'b1', clientName: 'Anna', email: 'anna@test.cat', status: 'sent' });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(401);
  });

  it('processa bookings i retorna summary', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary.processed).toBe(1);
    expect(body.summary.sent).toBe(1);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'emails.cron', status: 'ok' }));
  });

  it('gestiona errors individuals', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP'));
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.errors).toBe(1);
  });

  it('retorna 500 si falla globalment', async () => {
    mockListPending.mockRejectedValueOnce(new Error('DB crash'));
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(500);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'emails.cron', status: 'error' }));
  });
});
