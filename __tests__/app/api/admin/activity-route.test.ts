import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockFetchCanonicalAdminActivityPage,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockFetchCanonicalAdminActivityPage: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/logger', () => ({ log: { error: mockLogError } }));
vi.mock('@/lib/services/timelineQueryService', () => ({
  fetchCanonicalAdminActivityPage: mockFetchCanonicalAdminActivityPage,
}));

import { GET } from '@/app/api/admin/activity/route';

describe('/api/admin/activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockRequireAuth.mockReturnValue(null);
    mockFetchCanonicalAdminActivityPage.mockResolvedValue({ ok: true, items: [] });
  });

  it('passa query sanejada al servei canònic', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'));

    const res = await GET(new NextRequest('http://localhost/api/admin/activity?category=system&days=4.9&page=2.8&limit=25.6'));

    expect(res.status).toBe(200);
    expect(mockFetchCanonicalAdminActivityPage).toHaveBeenCalledWith({
      since: new Date('2026-06-27T12:00:00.000Z'),
      category: 'system',
      page: 2,
      limit: 25,
    });
    await expect(res.json()).resolves.toEqual({ ok: true, items: [] });
  });

  it('aplica defaults i límits amb query bruta', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'));

    await GET(new NextRequest('http://localhost/api/admin/activity?days=Infinity&page=-2&limit=999'));

    expect(mockFetchCanonicalAdminActivityPage).toHaveBeenCalledWith({
      since: new Date('2026-06-24T12:00:00.000Z'),
      category: null,
      page: 1,
      limit: 200,
    });
  });

  it('rebutja auth abans de consultar activitat', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await GET(new NextRequest('http://localhost/api/admin/activity'));

    expect(res.status).toBe(401);
    expect(mockFetchCanonicalAdminActivityPage).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla el servei', async () => {
    mockFetchCanonicalAdminActivityPage.mockRejectedValueOnce(new Error('DB'));

    const res = await GET(new NextRequest('http://localhost/api/admin/activity'));

    expect(res.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'No s\'han pogut carregar els registres d\'activitat',
    });
  });
});
