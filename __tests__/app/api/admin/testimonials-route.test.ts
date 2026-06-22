import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockListAdminTestimonials,
  mockModerateTestimonial,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListAdminTestimonials: vi.fn(),
  mockModerateTestimonial: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/testimonialAdminService', () => ({
  listAdminTestimonials: mockListAdminTestimonials,
  moderateTestimonial: mockModerateTestimonial,
}));

import { GET, PATCH } from '@/app/api/admin/testimonials/route';

function makePatchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/testimonials', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/testimonials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListAdminTestimonials.mockResolvedValue({ ok: true, testimonials: [] });
    mockModerateTestimonial.mockResolvedValue({
      status: 200,
      body: { ok: true, testimonial: { id: 'test_1', isApproved: true } },
    });
  });

  it('llista testimonis sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/testimonials?status=pending&limit=10&offset=5'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListAdminTestimonials).toHaveBeenCalledWith({
      status: 'pending',
      limit: 10,
      offset: 5,
    });
    await expect(res.json()).resolves.toEqual({ ok: true, testimonials: [] });
  });

  it('rebutja auth abans de CSRF en PATCH', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await PATCH(makePatchReq({ id: 'test_1', action: 'approve' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockModerateTestimonial).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o moderar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePatchReq({ id: 'test_1', action: 'approve' });

    const res = await PATCH(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockModerateTestimonial).not.toHaveBeenCalled();
  });

  it('modera testimoni amb CSRF valid', async () => {
    const res = await PATCH(makePatchReq({ id: 'test_1', action: 'approve' }));

    expect(res.status).toBe(200);
    expect(mockModerateTestimonial).toHaveBeenCalledWith('test_1', 'approve');
    await expect(res.json()).resolves.toEqual({
      ok: true,
      testimonial: { id: 'test_1', isApproved: true },
    });
  });

  it('propaga status funcional del servei', async () => {
    mockModerateTestimonial.mockResolvedValueOnce({
      status: 400,
      body: { ok: false, error: 'Missing id or action' },
    });

    const res = await PATCH(makePatchReq({ id: 'test_1' }));

    expect(res.status).toBe(400);
    expect(mockModerateTestimonial).toHaveBeenCalledWith('test_1', undefined);
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'Missing id or action' });
  });

  it('retorna 500 si falla el body o servei', async () => {
    mockModerateTestimonial.mockRejectedValueOnce(new Error('DB'));

    const res = await PATCH(makePatchReq({ id: 'test_1', action: 'approve' }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'Failed to update testimonial',
    });
  });
});
