import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockRequirePermission, mockGetAdminRole, mockGetActive, mockIssue, mockNormalizeLocale, mockRevoke } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockGetAdminRole: vi.fn(),
  mockGetActive: vi.fn(),
  mockIssue: vi.fn(),
  mockNormalizeLocale: vi.fn(),
  mockRevoke: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission, getAdminRole: mockGetAdminRole }));
vi.mock('@/lib/services/clientPortalAccess', () => ({
  getActivePortalAccessForBooking: mockGetActive,
  issueClientPortalAccess: mockIssue,
  normalizePortalLocale: mockNormalizeLocale,
  revokeActiveClientPortalAccess: mockRevoke,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { GET, POST, DELETE } from '@/app/api/admin/bookings/[id]/portal-access/route';

function makeGetReq(id = 'book-1') {
  return { req: new NextRequest(`http://localhost/api/admin/bookings/${id}/portal-access`), params: { params: { id } } };
}
function makePostReq(id: string, body: Record<string, unknown> = {}) {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}/portal-access`, {
      method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}
function makeDeleteReq(id = 'book-1') {
  return { req: new NextRequest(`http://localhost/api/admin/bookings/${id}/portal-access`, { method: 'DELETE' }), params: { params: { id } } };
}

describe('GET /api/admin/bookings/[id]/portal-access', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockGetActive.mockResolvedValue({ id: 'pa-1', active: true }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await GET(makeGetReq().req, makeGetReq().params)).status).toBe(401);
  });

  it('rebutja sense permís read', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    expect((await GET(makeGetReq().req, makeGetReq().params)).status).toBe(403);
  });

  it('retorna accés actiu', async () => {
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.active.id).toBe('pa-1');
  });

  it('retorna 500 si falla', async () => {
    mockGetActive.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(makeGetReq().req, makeGetReq().params)).status).toBe(500);
  });
});

describe('POST /api/admin/bookings/[id]/portal-access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockGetAdminRole.mockReturnValue('ADMIN');
    mockNormalizeLocale.mockReturnValue('ca');
    mockIssue.mockResolvedValue({ access: { id: 'pa-2' }, url: 'https://portal.test/abc', token: 'tok-1' });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(makePostReq('book-1').req, makePostReq('book-1').params)).status).toBe(401);
  });

  it('genera enllaç correctament', async () => {
    const { req, params } = makePostReq('book-1', { locale: 'ca' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.url).toBe('https://portal.test/abc');
    expect(body.token).toBe('tok-1');
  });

  it('retorna 404 si booking no existeix', async () => {
    mockIssue.mockRejectedValueOnce(new Error('BOOKING_NOT_FOUND'));
    const { req, params } = makePostReq('book-xxx');
    expect((await POST(req, params)).status).toBe(404);
  });

  it('retorna 500 si error genèric', async () => {
    mockIssue.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePostReq('book-1');
    expect((await POST(req, params)).status).toBe(500);
  });
});

describe('DELETE /api/admin/bookings/[id]/portal-access', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockRevoke.mockResolvedValue(1); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await DELETE(makeDeleteReq().req, makeDeleteReq().params)).status).toBe(401);
  });

  it('revoca accés correctament', async () => {
    const { req, params } = makeDeleteReq('book-1');
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    expect(mockRevoke).toHaveBeenCalledWith('book-1');
  });

  it('retorna 500 si falla', async () => {
    mockRevoke.mockRejectedValueOnce(new Error('DB'));
    expect((await DELETE(makeDeleteReq().req, makeDeleteReq().params)).status).toBe(500);
  });
});
