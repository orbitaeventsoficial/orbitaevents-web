import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGetChecklist, mockSaveChecklist } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetChecklist: vi.fn(),
  mockSaveChecklist: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/bookingChecklistService', () => ({
  getBookingChecklist: mockGetChecklist,
  saveBookingChecklist: mockSaveChecklist,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { GET, PUT } from '@/app/api/admin/bookings/[id]/checklist/route';

function makeGetReq(id = 'book-1') {
  return { req: new NextRequest(`http://localhost/api/admin/bookings/${id}/checklist`), params: { params: { id } } };
}

function makePutReq(id: string, body: unknown) {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}/checklist`, {
      method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('GET /api/admin/bookings/[id]/checklist', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockGetChecklist.mockResolvedValue([{ label: 'DJ', done: true }]); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makeGetReq();
    expect((await GET(req, params)).status).toBe(401);
  });

  it('retorna items', async () => {
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.items).toEqual([{ label: 'DJ', done: true }]);
  });

  it('passa id correcte', async () => {
    const { req, params } = makeGetReq('book-abc');
    await GET(req, params);
    expect(mockGetChecklist).toHaveBeenCalledWith('book-abc');
  });
});

describe('PUT /api/admin/bookings/[id]/checklist', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockSaveChecklist.mockResolvedValue(undefined); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makePutReq('book-1', { items: [] });
    expect((await PUT(req, params)).status).toBe(401);
  });

  it('desa checklist correctament', async () => {
    const items = [{ label: 'DJ', done: true }, { label: 'Llums', done: false }];
    const { req, params } = makePutReq('book-1', { items });
    const res = await PUT(req, params);
    expect(res.status).toBe(200);
    expect(mockSaveChecklist).toHaveBeenCalledWith('book-1', items);
  });

  it('rebutja si items no és array', async () => {
    const { req, params } = makePutReq('book-1', { items: 'not-array' });
    const res = await PUT(req, params);
    expect(res.status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockSaveChecklist.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePutReq('book-1', { items: [] });
    expect((await PUT(req, params)).status).toBe(500);
  });
});
