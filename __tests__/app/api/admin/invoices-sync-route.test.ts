import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockRetrySync } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRetrySync: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/invoiceService', () => ({ retryHoldedSync: mockRetrySync }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: vi.fn().mockReturnValue('req-sync') }));

import { POST } from '@/app/api/admin/invoices/[id]/sync/route';

const ctx = { params: { id: 'inv-1' } };

describe('POST /api/admin/invoices/[id]/sync', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockRetrySync.mockResolvedValue(undefined); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }), ctx)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }), ctx)).status).toBe(403);
  });

  it('sincronitza amb Holded', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }), ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockRetrySync).toHaveBeenCalledWith('inv-1');
  });

  it('retorna 400 si falla', async () => {
    mockRetrySync.mockRejectedValueOnce(new Error('Holded API error'));
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }), ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Holded API error');
  });
});
