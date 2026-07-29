import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockEnsurePortfolioEventFromPostEventReport,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockEnsurePortfolioEventFromPostEventReport: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({
  log: { error: mockLogError, info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/services/portfolioEventService', () => ({
  ensurePortfolioEventFromPostEventReport: mockEnsurePortfolioEventFromPostEventReport,
}));

import { POST } from '@/app/api/admin/post-event/portfolio-event/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/post-event/portfolio-event', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/post-event/portfolio-event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockEnsurePortfolioEventFromPostEventReport.mockResolvedValue({
      status: 'CREATED',
      event: {
        id: 'evt-1',
        title: 'Anna Garcia',
        slug: 'oe-2026-001-anna-garcia',
        categorySlug: 'bodas',
        published: false,
      },
    });
  });

  it('rebutja auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ bookingId: 'booking-1' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockEnsurePortfolioEventFromPostEventReport).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ bookingId: 'booking-1' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockEnsurePortfolioEventFromPostEventReport).not.toHaveBeenCalled();
  });

  it('valida bookingId obligatori', async () => {
    const res = await POST(makePostReq({}));

    expect(res.status).toBe(400);
    expect(mockEnsurePortfolioEventFromPostEventReport).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: 'Dades invalides' });
  });

  it('crea draft de portfolio amb CSRF valid', async () => {
    const res = await POST(makePostReq({ bookingId: 'booking-1' }));

    expect(res.status).toBe(201);
    expect(mockEnsurePortfolioEventFromPostEventReport).toHaveBeenCalledWith('booking-1');
    await expect(res.json()).resolves.toEqual({
      ok: true,
      status: 'CREATED',
      message: 'Draft de portfolio creat',
      event: {
        id: 'evt-1',
        title: 'Anna Garcia',
        slug: 'oe-2026-001-anna-garcia',
        categorySlug: 'bodas',
        published: false,
        adminHref: '/admin/portfolio#events',
        publicHref: '/portfolio/bodas/oe-2026-001-anna-garcia',
      },
    });
  });

  it('retorna 200 si ja existeix event de portfolio', async () => {
    mockEnsurePortfolioEventFromPostEventReport.mockResolvedValueOnce({
      status: 'EXISTS',
      event: {
        id: 'evt-existing',
        title: 'Anna Garcia',
        slug: 'oe-2026-001-anna-garcia',
        categorySlug: 'bodas',
        published: true,
      },
    });

    const res = await POST(makePostReq({ bookingId: 'booking-1' }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      status: 'EXISTS',
      event: { id: 'evt-existing', adminHref: '/admin/portfolio#events' },
    });
  });

  it('propaga media pendent com a conflicte funcional', async () => {
    mockEnsurePortfolioEventFromPostEventReport.mockResolvedValueOnce({
      status: 'PORTFOLIO_MEDIA_REQUIRED',
    });

    const res = await POST(makePostReq({ bookingId: 'booking-1' }));

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      status: 'PORTFOLIO_MEDIA_REQUIRED',
      message: 'Marca una foto de la galeria com a portfolio i assigna categoria',
      event: null,
    });
  });

  it('retorna 500 si falla el servei', async () => {
    mockEnsurePortfolioEventFromPostEventReport.mockRejectedValueOnce(new Error('DB'));

    const res = await POST(makePostReq({ bookingId: 'booking-1' }));

    expect(res.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'Error creant portfolio post-event' });
  });
});
