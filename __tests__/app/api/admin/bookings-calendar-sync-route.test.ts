import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockRequirePermission, mockSync } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockSync: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/services/googleCalendarSyncService', () => ({ syncBookingToGoogleCalendar: mockSync }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { POST } from '@/app/api/admin/bookings/[id]/calendar-sync/route';

function makePostReq(id: string, body: Record<string, unknown> = {}) {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}/calendar-sync`, {
      method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('POST /api/admin/bookings/[id]/calendar-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockSync.mockResolvedValue({ ok: true, eventId: 'evt-1' });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makePostReq('book-1');
    expect((await POST(req, params)).status).toBe(401);
  });

  it('rebutja sense permís mutate', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const { req, params } = makePostReq('book-1');
    expect((await POST(req, params)).status).toBe(403);
  });

  it('sincronitza correctament (upsert)', async () => {
    const { req, params } = makePostReq('book-1', { action: 'upsert' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockSync).toHaveBeenCalledWith('book-1', 'upsert');
  });

  it('sincronitza amb action delete', async () => {
    const { req, params } = makePostReq('book-1', { action: 'delete' });
    await POST(req, params);
    expect(mockSync).toHaveBeenCalledWith('book-1', 'delete');
  });

  it('passa undefined si action desconeguda', async () => {
    const { req, params } = makePostReq('book-1', { action: 'other' });
    await POST(req, params);
    expect(mockSync).toHaveBeenCalledWith('book-1', undefined);
  });

  it('retorna 500 si sync falla', async () => {
    mockSync.mockResolvedValueOnce({ ok: false, error: 'No token' });
    const { req, params } = makePostReq('book-1');
    expect((await POST(req, params)).status).toBe(500);
  });

  it('retorna 500 si excepció', async () => {
    mockSync.mockRejectedValueOnce(new Error('Network'));
    const { req, params } = makePostReq('book-1');
    expect((await POST(req, params)).status).toBe(500);
  });
});
