import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGetById, mockUpdateStatus } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetById: vi.fn(),
  mockUpdateStatus: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/invoiceAdminService', () => ({
  getAdminInvoiceById: mockGetById,
  updateAdminInvoiceStatus: mockUpdateStatus,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: vi.fn().mockReturnValue('req-id') }));

import { GET, PATCH } from '@/app/api/admin/invoices/[id]/route';

const ctx = { params: { id: 'inv-1' } };

describe('GET /api/admin/invoices/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockGetById.mockResolvedValue({ status: 200, body: { id: 'inv-1' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(401);
  });

  it('retorna factura', async () => {
    const res = await GET(new NextRequest('http://localhost/x'), ctx);
    expect(res.status).toBe(200);
    expect(mockGetById).toHaveBeenCalledWith('inv-1');
  });

  it('passthrough 404', async () => {
    mockGetById.mockResolvedValueOnce({ status: 404, body: { error: 'No trobada' } });
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(404);
  });

  it('retorna 500 si falla', async () => {
    mockGetById.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/x'), ctx)).status).toBe(500);
  });
});

describe('PATCH /api/admin/invoices/[id]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpdateStatus.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ status: 'PAID' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(401);
  });

  it('actualitza estat factura', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ status: 'PAID' }), headers: { 'Content-Type': 'application/json' } });
    const res = await PATCH(req, ctx);
    expect(res.status).toBe(200);
    expect(mockUpdateStatus).toHaveBeenCalledWith('inv-1', 'PAID');
  });

  it('retorna 400 si falla', async () => {
    mockUpdateStatus.mockRejectedValueOnce(new Error('Invalid'));
    const req = new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ status: 'PAID' }), headers: { 'Content-Type': 'application/json' } });
    expect((await PATCH(req, ctx)).status).toBe(400);
  });
});
