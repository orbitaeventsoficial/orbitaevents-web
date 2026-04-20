import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockExport } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockExport: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/privacyService', () => ({ exportCustomerData: mockExport }));

import { GET } from '@/app/api/admin/customers/[id]/export/route';

const exportData = { id: 'c1', name: 'Anna', leads: [], bookings: [] };

describe('GET /api/admin/customers/[id]/export', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockExport.mockResolvedValue(exportData); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'), { params: Promise.resolve({ id: 'c1' }) })).status).toBe(401);
  });

  it('retorna dades exportades', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/customers/c1/export'), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockExport).toHaveBeenCalledWith('c1', false);
  });

  it('passa portable=1', async () => {
    await GET(new NextRequest('http://localhost/api/admin/customers/c1/export?portable=1'), { params: Promise.resolve({ id: 'c1' }) });
    expect(mockExport).toHaveBeenCalledWith('c1', true);
  });

  it('retorna attachment amb download=1', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/customers/c1/export?download=1'), { params: Promise.resolve({ id: 'c1' }) });
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
  });

  it('retorna 500 si falla', async () => {
    mockExport.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/api/admin/customers/c1/export'), { params: Promise.resolve({ id: 'c1' }) })).status).toBe(500);
  });
});
