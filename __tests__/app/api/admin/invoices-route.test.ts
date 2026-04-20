import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockList, mockCreate } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockList: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/invoiceAdminService', () => ({
  listAdminInvoices: mockList,
  createAdminInvoiceFromBooking: mockCreate,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: vi.fn().mockReturnValue('req-inv') }));

import { GET, POST } from '@/app/api/admin/invoices/route';

describe('GET /api/admin/invoices', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockList.mockResolvedValue({ items: [], total: 0 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/invoices'))).status).toBe(401);
  });

  it('retorna llista', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/invoices'));
    expect(res.status).toBe(200);
  });

  it('passa paginació', async () => {
    await GET(new NextRequest('http://localhost/api/admin/invoices?page=2&limit=10'));
    expect(mockList).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('retorna 500 si falla', async () => {
    mockList.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/api/admin/invoices'))).status).toBe(500);
  });
});

describe('POST /api/admin/invoices', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockCreate.mockResolvedValue({ ok: true, id: 'inv-1' }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ bookingId: 'b1' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ bookingId: 'b1' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(403);
  });

  it('crea factura', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ bookingId: 'b1' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith('b1');
  });

  it('rebutja sense bookingId', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(400);
  });

  it('retorna 400 si falla servei', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Booking not found'));
    const req = new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify({ bookingId: 'b1' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(400);
  });
});
