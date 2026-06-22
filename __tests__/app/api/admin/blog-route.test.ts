import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockListAdminBlogPosts,
  mockCreateAdminBlogPost,
  mockUpdateAdminBlogPost,
  mockDeleteAdminBlogPost,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListAdminBlogPosts: vi.fn(),
  mockCreateAdminBlogPost: vi.fn(),
  mockUpdateAdminBlogPost: vi.fn(),
  mockDeleteAdminBlogPost: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/services/blogAdminService', () => ({
  listAdminBlogPosts: mockListAdminBlogPosts,
  createAdminBlogPost: mockCreateAdminBlogPost,
  updateAdminBlogPost: mockUpdateAdminBlogPost,
  deleteAdminBlogPost: mockDeleteAdminBlogPost,
}));

import { DELETE, GET, POST, PUT } from '@/app/api/admin/blog/route';

function req(method: string, url = 'http://localhost/api/admin/blog', body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('/api/admin/blog route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListAdminBlogPosts.mockResolvedValue({ status: 200, body: { posts: [], total: 0 } });
    mockCreateAdminBlogPost.mockResolvedValue({ status: 201, body: { id: 'blog-1' } });
    mockUpdateAdminBlogPost.mockResolvedValue({ status: 200, body: { id: 'blog-1', updated: true } });
    mockDeleteAdminBlogPost.mockResolvedValue({ status: 200, body: { success: true } });
  });

  it('GET llista posts sense validar CSRF', async () => {
    const res = await GET(req('GET', 'http://localhost/api/admin/blog?page=2&limit=10&locale=ca&category=events&published=true'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ posts: [], total: 0 });
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListAdminBlogPosts).toHaveBeenCalledWith({
      id: null,
      locale: 'ca',
      page: 2,
      limit: 10,
      category: 'events',
      published: 'true',
    });
  });

  it('POST rebutja sense auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('Unauthorized', { status: 401 }));
    const res = await POST(req('POST', 'http://localhost/api/admin/blog', { title: 'T' }));
    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateAdminBlogPost).not.toHaveBeenCalled();
  });

  it('POST rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const res = await POST(req('POST', 'http://localhost/api/admin/blog', { title: 'T' }));
    expect(res.status).toBe(403);
    expect(mockCreateAdminBlogPost).not.toHaveBeenCalled();
  });

  it('POST crea post amb body validat', async () => {
    const body = { translations: [{ locale: 'ca', title: 'T', content: 'C' }] };
    const res = await POST(req('POST', 'http://localhost/api/admin/blog', body));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ id: 'blog-1' });
    expect(mockVerifyCsrf).toHaveBeenCalledTimes(1);
    expect(mockCreateAdminBlogPost).toHaveBeenCalledWith(body);
  });

  it('PUT rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const res = await PUT(req('PUT', 'http://localhost/api/admin/blog', { id: 'blog-1' }));
    expect(res.status).toBe(403);
    expect(mockUpdateAdminBlogPost).not.toHaveBeenCalled();
  });

  it('PUT actualitza post amb body validat', async () => {
    const body = { id: 'blog-1', published: true };
    const res = await PUT(req('PUT', 'http://localhost/api/admin/blog', body));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ id: 'blog-1', updated: true });
    expect(mockUpdateAdminBlogPost).toHaveBeenCalledWith(body);
  });

  it('DELETE rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const res = await DELETE(req('DELETE', 'http://localhost/api/admin/blog?id=blog-1'));
    expect(res.status).toBe(403);
    expect(mockDeleteAdminBlogPost).not.toHaveBeenCalled();
  });

  it('DELETE elimina per id', async () => {
    const res = await DELETE(req('DELETE', 'http://localhost/api/admin/blog?id=blog-1'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(mockDeleteAdminBlogPost).toHaveBeenCalledWith('blog-1');
  });
});
