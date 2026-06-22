import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockIsAdminStatKey, mockListStats, mockUpdateFallback } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockIsAdminStatKey: vi.fn(),
  mockListStats: vi.fn(),
  mockUpdateFallback: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/adminStatsService', () => ({
  isAdminStatKey: mockIsAdminStatKey,
  listAdminStats: mockListStats,
  updateAdminStatFallback: mockUpdateFallback,
}));

import { GET, POST } from '@/app/api/admin/stats/route';

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/stats', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockIsAdminStatKey.mockReturnValue(true);
    mockListStats.mockResolvedValue([{ key: 'events_completed', value: 12 }]);
    mockUpdateFallback.mockResolvedValue({ ok: true, stat: { key: 'events_completed', fallback: 20 } });
  });

  it('retorna stats sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/stats'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({ ok: true, stats: [{ key: 'events_completed', value: 12 }] });
  });

  it('rebutja auth abans de CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makeReq({ key: 'events_completed', fallback: 20 }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o actualitzar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq({ key: 'events_completed', fallback: 20 });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdateFallback).not.toHaveBeenCalled();
  });

  it('retorna 400 si falta key', async () => {
    const res = await POST(makeReq({ fallback: 20 }));

    expect(res.status).toBe(400);
    expect(mockIsAdminStatKey).not.toHaveBeenCalled();
    expect(mockUpdateFallback).not.toHaveBeenCalled();
  });

  it('retorna 400 si la key no és vàlida', async () => {
    mockIsAdminStatKey.mockReturnValueOnce(false);

    const res = await POST(makeReq({ key: 'invalid', fallback: 20 }));

    expect(res.status).toBe(400);
    expect(mockUpdateFallback).not.toHaveBeenCalled();
  });

  it('actualitza fallback amb CSRF valid', async () => {
    const res = await POST(makeReq({ key: 'events_completed', fallback: 20, resetToCalculated: false }));

    expect(res.status).toBe(200);
    expect(mockUpdateFallback).toHaveBeenCalledWith({
      key: 'events_completed',
      fallback: 20,
      resetToCalculated: false,
    });
    expect(await res.json()).toEqual({ ok: true, stat: { key: 'events_completed', fallback: 20 } });
  });
});
