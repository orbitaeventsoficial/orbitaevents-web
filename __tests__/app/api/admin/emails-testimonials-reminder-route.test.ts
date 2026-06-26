import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockPrisma } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockPrisma: { customerTestimonial: { count: vi.fn() } },
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { POST } from '@/app/api/admin/emails/testimonials-reminder/route';

describe('POST /api/admin/emails/testimonials-reminder', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockPrisma.customerTestimonial.count.mockResolvedValue(5); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(401);
  });

  it('retorna recompte de testimonis pendents', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.pendingCount).toBe(5);
    expect(mockPrisma.customerTestimonial.count).toHaveBeenCalledWith({ where: { isApproved: false } });
  });

  it('retorna 500 si falla', async () => {
    mockPrisma.customerTestimonial.count.mockRejectedValueOnce(new Error('DB'));
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });
});
