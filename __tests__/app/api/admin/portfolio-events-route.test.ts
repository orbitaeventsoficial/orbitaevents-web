import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockCreatePortfolioEvent,
  mockDeletePortfolioEvent,
  mockListPortfolioEvents,
  mockUpdatePortfolioEvent,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreatePortfolioEvent: vi.fn(),
  mockDeletePortfolioEvent: vi.fn(),
  mockListPortfolioEvents: vi.fn(),
  mockUpdatePortfolioEvent: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/portfolioEventService', () => ({
  createPortfolioEvent: mockCreatePortfolioEvent,
  deletePortfolioEvent: mockDeletePortfolioEvent,
  listPortfolioEvents: mockListPortfolioEvents,
  updatePortfolioEvent: mockUpdatePortfolioEvent,
}));

import { DELETE, GET, PATCH, POST } from '@/app/api/admin/portfolio/events/route';

function makeJsonReq(method: 'PATCH' | 'POST', body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/portfolio/events', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/portfolio/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreatePortfolioEvent.mockResolvedValue({ id: 'evt-1', slug: 'casament-demo' });
    mockDeletePortfolioEvent.mockResolvedValue(undefined);
    mockListPortfolioEvents.mockResolvedValue({ data: [{ id: 'evt-1' }] });
    mockUpdatePortfolioEvent.mockResolvedValue({ id: 'evt-1', title: 'Nou titol' });
  });

  it('llista events sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/portfolio/events?categorySlug=bodas&published=all&limit=5&offset=10'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListPortfolioEvents).toHaveBeenCalledWith({
      categorySlug: 'bodas',
      published: undefined,
      limit: 5,
      offset: 10,
    });
  });

  it('rebutja auth abans de CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makeJsonReq('POST', { slug: 'evt', categorySlug: 'bodas', title: 'Titol', coverImage: '/x.jpg' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreatePortfolioEvent).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body en POST', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeJsonReq('POST', { slug: 'evt', categorySlug: 'bodas', title: 'Titol', coverImage: '/x.jpg' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreatePortfolioEvent).not.toHaveBeenCalled();
  });

  it('crea event amb CSRF valid', async () => {
    const res = await POST(makeJsonReq('POST', {
      slug: 'evt',
      categorySlug: 'bodas',
      title: 'Titol',
      coverImage: '/x.jpg',
      services: ['dj'],
    }));

    expect(res.status).toBe(201);
    expect(mockCreatePortfolioEvent).toHaveBeenCalledWith(expect.objectContaining({
      slug: 'evt',
      categorySlug: 'bodas',
      title: 'Titol',
      coverImage: '/x.jpg',
      services: ['dj'],
      published: false,
    }));
    await expect(res.json()).resolves.toEqual({ data: { id: 'evt-1', slug: 'casament-demo' } });
  });

  it('rebutja CSRF abans de llegir body en PATCH', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeJsonReq('PATCH', { id: 'evt-1', title: 'Nou titol' });

    const res = await PATCH(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdatePortfolioEvent).not.toHaveBeenCalled();
  });

  it('actualitza event amb CSRF valid', async () => {
    const res = await PATCH(makeJsonReq('PATCH', { id: 'evt-1', title: 'Nou titol' }));

    expect(res.status).toBe(200);
    expect(mockUpdatePortfolioEvent).toHaveBeenCalledWith('evt-1', { title: 'Nou titol' });
    await expect(res.json()).resolves.toEqual({ data: { id: 'evt-1', title: 'Nou titol' } });
  });

  it('rebutja CSRF abans de llegir query en DELETE', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/portfolio/events?id=evt-1', { method: 'DELETE' });

    const res = await DELETE(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockDeletePortfolioEvent).not.toHaveBeenCalled();
  });

  it('elimina event amb CSRF valid', async () => {
    const res = await DELETE(new NextRequest('http://localhost/api/admin/portfolio/events?id=evt-1', { method: 'DELETE' }));

    expect(res.status).toBe(200);
    expect(mockDeletePortfolioEvent).toHaveBeenCalledWith('evt-1');
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
