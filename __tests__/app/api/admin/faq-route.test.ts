import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockListAdminFaqs,
  mockCreateAdminFaq,
  mockDeleteAdminFaq,
  mockGetAdminFaqById,
  mockUpdateAdminFaq,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListAdminFaqs: vi.fn(),
  mockCreateAdminFaq: vi.fn(),
  mockDeleteAdminFaq: vi.fn(),
  mockGetAdminFaqById: vi.fn(),
  mockUpdateAdminFaq: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: mockLogError } }));
vi.mock('@/lib/services/faqAdminService', () => ({
  createAdminFaq: mockCreateAdminFaq,
  deleteAdminFaq: mockDeleteAdminFaq,
  getAdminFaqById: mockGetAdminFaqById,
  listAdminFaqs: mockListAdminFaqs,
  updateAdminFaq: mockUpdateAdminFaq,
}));

import { DELETE, GET, POST } from '@/app/api/admin/faq/route';
import { GET as GET_DETAIL, PATCH } from '@/app/api/admin/faq/[id]/route';

const params = (id = 'faq-1') => ({ params: Promise.resolve({ id }) });

describe('GET /api/admin/faq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListAdminFaqs.mockResolvedValue({ ok: true, faqs: [{ id: 'faq-1' }] });
  });

  it('retorna FAQs sense exigir CSRF', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/faq'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, faqs: [{ id: 'faq-1' }] });
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });
});

describe('POST /api/admin/faq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateAdminFaq.mockResolvedValue({ status: 200, body: { ok: true, faq: { id: 'faq-1' } } });
  });

  it('rebutja sense auth abans de permisos o CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(new NextRequest('http://localhost/api/admin/faq', { method: 'POST' }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateAdminFaq).not.toHaveBeenCalled();
  });

  it('rebutja sense permís mutate abans de validar CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/faq', {
      method: 'POST',
      body: JSON.stringify({ slug: 'nova' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateAdminFaq).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF abans de llegir el body o crear', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/faq', {
      method: 'POST',
      body: JSON.stringify({ slug: 'nova' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockCreateAdminFaq).not.toHaveBeenCalled();
  });

  it('crea FAQ amb CSRF vàlid', async () => {
    const payload = { slug: 'nova' };
    const req = new NextRequest('http://localhost/api/admin/faq', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreateAdminFaq).toHaveBeenCalledWith(payload);
  });
});

describe('DELETE /api/admin/faq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockDeleteAdminFaq.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense CSRF abans d\'eliminar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/faq?id=faq-1', { method: 'DELETE' });

    const res = await DELETE(req);

    expect(res.status).toBe(403);
    expect(mockDeleteAdminFaq).not.toHaveBeenCalled();
  });

  it('elimina FAQ amb CSRF vàlid', async () => {
    const req = new NextRequest('http://localhost/api/admin/faq?id=faq-1', { method: 'DELETE' });

    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockDeleteAdminFaq).toHaveBeenCalledWith('faq-1');
  });
});

describe('GET /api/admin/faq/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetAdminFaqById.mockResolvedValue({ status: 200, body: { ok: true, faq: { id: 'faq-1' } } });
  });

  it('retorna FAQ sense exigir CSRF', async () => {
    const res = await GET_DETAIL(new NextRequest('http://localhost/api/admin/faq/faq-1'), params());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, faq: { id: 'faq-1' } });
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/admin/faq/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockUpdateAdminFaq.mockResolvedValue({ status: 200, body: { ok: true, faq: { id: 'faq-1' } } });
  });

  it('rebutja sense CSRF abans de llegir el body o actualitzar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/faq/faq-1', {
      method: 'PATCH',
      body: JSON.stringify({ slug: 'nova' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, params());

    expect(res.status).toBe(403);
    expect(mockUpdateAdminFaq).not.toHaveBeenCalled();
  });

  it('actualitza FAQ amb CSRF vàlid', async () => {
    const payload = { slug: 'nova' };
    const req = new NextRequest('http://localhost/api/admin/faq/faq-1', {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req, params());

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockUpdateAdminFaq).toHaveBeenCalledWith('faq-1', payload);
  });
});
