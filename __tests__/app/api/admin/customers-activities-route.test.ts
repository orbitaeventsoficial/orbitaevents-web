import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockListActivities, mockCreateNote } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListActivities: vi.fn(),
  mockCreateNote: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/csrf', () => ({
  verifyCsrf: mockVerifyCsrf,
}));
vi.mock('@/lib/services/customerActivityService', () => ({
  listCustomerActivities: mockListActivities,
  createCustomerActivityNote: mockCreateNote,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { GET, POST } from '@/app/api/admin/customers/[id]/activities/route';

function makeGetReq(id = 'cust-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/customers/${id}/activities`),
    params: { params: { id } },
  };
}

function makePostReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/customers/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('GET /api/admin/customers/[id]/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockListActivities.mockResolvedValue([{ id: 'act-1', action: 'NOTE' }]);
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(401);
    expect(mockListActivities).not.toHaveBeenCalled();
  });

  it('retorna activitats del client', async () => {
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 'act-1', action: 'NOTE' }]);
  });

  it('passa id correcte', async () => {
    const { req, params } = makeGetReq('cust-xyz');
    await GET(req, params);
    expect(mockListActivities).toHaveBeenCalledWith('cust-xyz');
  });

  it('retorna 500 si falla', async () => {
    mockListActivities.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/admin/customers/[id]/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateNote.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePostReq('cust-1', { note: 'Hola' });
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'CSRF token missing' }), { status: 403 }),
    );
    const { req, params } = makePostReq('cust-1', { note: 'Hola' });
    const res = await POST(req, params);
    expect(res.status).toBe(403);
  });

  it('crea nota correctament', async () => {
    const { req, params } = makePostReq('cust-1', { note: 'Nota del client', action: 'SEGUIMENT' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockCreateNote).toHaveBeenCalledWith('cust-1', { note: 'Nota del client', action: 'SEGUIMENT' });
  });

  it('rebutja nota buida', async () => {
    const { req, params } = makePostReq('cust-1', { note: '' });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja nota massa llarga', async () => {
    const { req, params } = makePostReq('cust-1', { note: 'x'.repeat(4001) });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja action massa llarga', async () => {
    const { req, params } = makePostReq('cust-1', { note: 'OK', action: 'x'.repeat(81) });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockCreateNote.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePostReq('cust-1', { note: 'Test' });
    const res = await POST(req, params);
    expect(res.status).toBe(500);
  });
});
