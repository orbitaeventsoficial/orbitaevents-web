import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockCreateAdminPostEventReport,
  mockLogInfo,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreateAdminPostEventReport: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({
  log: { error: mockLogError, info: mockLogInfo, warn: vi.fn() },
}));
vi.mock('@/lib/services/postEventReportAdminService', () => ({
  createAdminPostEventReport: mockCreateAdminPostEventReport,
}));

import { POST } from '@/app/api/admin/post-event/reports/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/post-event/reports', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/post-event/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateAdminPostEventReport.mockResolvedValue({
      status: 201,
      body: {
        ok: true,
        report: { id: 'rep_1', bookingId: 'booking_1', status: 'DRAFT' },
      },
    });
  });

  it('rebutja auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ bookingId: 'booking_1' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateAdminPostEventReport).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o crear informe', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ bookingId: 'booking_1' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreateAdminPostEventReport).not.toHaveBeenCalled();
  });

  it('crea informe amb CSRF valid', async () => {
    const payload = { bookingId: 'booking_1', summary: 'Tot correcte' };

    const res = await POST(makePostReq(payload));

    expect(res.status).toBe(201);
    expect(mockCreateAdminPostEventReport).toHaveBeenCalledWith(payload);
    expect(mockLogInfo).toHaveBeenCalledWith(
      'Created post-event report for booking booking_1',
      { reportId: 'rep_1', status: 'DRAFT' }
    );
    await expect(res.json()).resolves.toEqual({
      ok: true,
      report: { id: 'rep_1', bookingId: 'booking_1', status: 'DRAFT' },
    });
  });

  it('propaga errors funcionals del servei', async () => {
    mockCreateAdminPostEventReport.mockResolvedValueOnce({
      status: 400,
      body: { ok: false, error: 'Booking obligatori' },
    });

    const res = await POST(makePostReq({}));

    expect(res.status).toBe(400);
    expect(mockLogInfo).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'Booking obligatori' });
  });

  it('retorna 500 si falla el servei', async () => {
    mockCreateAdminPostEventReport.mockRejectedValueOnce(new Error('DB'));

    const res = await POST(makePostReq({ bookingId: 'booking_1' }));

    expect(res.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'Error creant informe' });
  });
});
