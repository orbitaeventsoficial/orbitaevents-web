import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockCreateSocialPost,
  mockDeleteSocialPost,
  mockGetSocialCalendar,
  mockGetSocialPost,
  mockGetSocialPostCounts,
  mockListSocialPosts,
  mockUpdateSocialPost,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreateSocialPost: vi.fn(),
  mockDeleteSocialPost: vi.fn(),
  mockGetSocialCalendar: vi.fn(),
  mockGetSocialPost: vi.fn(),
  mockGetSocialPostCounts: vi.fn(),
  mockListSocialPosts: vi.fn(),
  mockUpdateSocialPost: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/socialPostService', () => ({
  createSocialPost: mockCreateSocialPost,
  deleteSocialPost: mockDeleteSocialPost,
  getSocialCalendar: mockGetSocialCalendar,
  getSocialPost: mockGetSocialPost,
  getSocialPostCounts: mockGetSocialPostCounts,
  listSocialPosts: mockListSocialPosts,
  updateSocialPost: mockUpdateSocialPost,
}));

import * as collectionRoute from '@/app/api/admin/social-posts/route';
import * as detailRoute from '@/app/api/admin/social-posts/[id]/route';

const validPayload = {
  title: 'Post de prova',
  platforms: ['INSTAGRAM'],
  status: 'DRAFT',
  contentType: 'IMAGE',
  category: 'PROMO',
};

function makeReq(method: 'POST' | 'PATCH' | 'DELETE', url: string, body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

describe('/api/admin/social-posts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateSocialPost.mockResolvedValue({ id: 'sp_1', ...validPayload });
    mockDeleteSocialPost.mockResolvedValue(undefined);
    mockGetSocialCalendar.mockResolvedValue([]);
    mockGetSocialPost.mockResolvedValue({ id: 'sp_1', ...validPayload });
    mockGetSocialPostCounts.mockResolvedValue({ total: 1 });
    mockListSocialPosts.mockResolvedValue([{ id: 'sp_1', ...validPayload }]);
    mockUpdateSocialPost.mockResolvedValue({ id: 'sp_1', title: 'Actualitzat' });
  });

  it('llista publicacions sense CSRF en lectura', async () => {
    const res = await collectionRoute.GET(new NextRequest('http://localhost/api/admin/social-posts'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListSocialPosts).toHaveBeenCalledTimes(1);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      posts: [{ id: 'sp_1', ...validPayload }],
    });
  });

  it('obte detall sense CSRF en lectura', async () => {
    const res = await detailRoute.GET(
      new NextRequest('http://localhost/api/admin/social-posts/sp_1'),
      { params: { id: 'sp_1' } }
    );

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetSocialPost).toHaveBeenCalledWith('sp_1');
  });

  it('rebutja auth abans de CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await collectionRoute.POST(
      makeReq('POST', 'http://localhost/api/admin/social-posts', validPayload)
    );

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateSocialPost).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o crear en POST', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('POST', 'http://localhost/api/admin/social-posts', validPayload);

    const res = await collectionRoute.POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreateSocialPost).not.toHaveBeenCalled();
  });

  it('crea publicacio amb CSRF valid', async () => {
    const res = await collectionRoute.POST(
      makeReq('POST', 'http://localhost/api/admin/social-posts', validPayload)
    );

    expect(res.status).toBe(200);
    expect(mockCreateSocialPost).toHaveBeenCalledWith(validPayload);
    await expect(res.json()).resolves.toEqual({ ok: true, post: { id: 'sp_1', ...validPayload } });
  });

  it('rebutja CSRF abans de llegir body o actualitzar en PATCH', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('PATCH', 'http://localhost/api/admin/social-posts/sp_1', { title: 'Actualitzat' });

    const res = await detailRoute.PATCH(req, { params: { id: 'sp_1' } });

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdateSocialPost).not.toHaveBeenCalled();
  });

  it('actualitza publicacio amb CSRF valid', async () => {
    const res = await detailRoute.PATCH(
      makeReq('PATCH', 'http://localhost/api/admin/social-posts/sp_1', { title: 'Actualitzat' }),
      { params: { id: 'sp_1' } }
    );

    expect(res.status).toBe(200);
    expect(mockUpdateSocialPost).toHaveBeenCalledWith('sp_1', { title: 'Actualitzat' });
    await expect(res.json()).resolves.toEqual({ ok: true, post: { id: 'sp_1', title: 'Actualitzat' } });
  });

  it("rebutja CSRF abans d'eliminar", async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('DELETE', 'http://localhost/api/admin/social-posts/sp_1');

    const res = await detailRoute.DELETE(req, { params: { id: 'sp_1' } });

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockDeleteSocialPost).not.toHaveBeenCalled();
  });

  it('elimina publicacio amb CSRF valid', async () => {
    const res = await detailRoute.DELETE(
      makeReq('DELETE', 'http://localhost/api/admin/social-posts/sp_1'),
      { params: { id: 'sp_1' } }
    );

    expect(res.status).toBe(200);
    expect(mockDeleteSocialPost).toHaveBeenCalledWith('sp_1');
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
