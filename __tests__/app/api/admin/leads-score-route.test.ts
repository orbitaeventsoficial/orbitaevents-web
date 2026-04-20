import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockGetScore, mockCreateSnapshot } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetScore: vi.fn(),
  mockCreateSnapshot: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({
  verifyCsrf: mockVerifyCsrf,
}));
vi.mock('@/lib/services/leadScoreAdminService', () => ({
  getAdminLeadScore: mockGetScore,
  createAdminLeadScoreSnapshot: mockCreateSnapshot,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { GET, POST } from '@/app/api/admin/leads/[id]/score/route';

function makeGetReq(id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/score`),
    params: { params: { id } },
  };
}

function makePostReq(id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/score`, { method: 'POST' }),
    params: { params: { id } },
  };
}

describe('GET /api/admin/leads/[id]/score', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockGetScore.mockResolvedValue({ status: 200, body: { score: 72, band: 'HIGH' } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(401);
    expect(mockGetScore).not.toHaveBeenCalled();
  });

  it('rebutja sense permís read', async () => {
    mockRequirePermission.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    );
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(403);
  });

  it('retorna score del lead', async () => {
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(72);
    expect(body.band).toBe('HIGH');
  });

  it('passa id correcte', async () => {
    const { req, params } = makeGetReq('lead-xyz');
    await GET(req, params);
    expect(mockGetScore).toHaveBeenCalledWith('lead-xyz');
  });

  it('retorna 500 si falla', async () => {
    mockGetScore.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/admin/leads/[id]/score (snapshot)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateSnapshot.mockResolvedValue({ status: 200, body: { ok: true, snapshotId: 'snap-1' } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePostReq();
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  it('rebutja sense permís automation', async () => {
    mockRequirePermission.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    );
    const { req, params } = makePostReq();
    const res = await POST(req, params);
    expect(res.status).toBe(403);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'CSRF token missing' }), { status: 403 }),
    );
    const { req, params } = makePostReq();
    const res = await POST(req, params);
    expect(res.status).toBe(403);
  });

  it('crea snapshot correctament', async () => {
    const { req, params } = makePostReq('lead-1');
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockCreateSnapshot).toHaveBeenCalledWith('lead-1');
  });

  it('retorna 500 si falla', async () => {
    mockCreateSnapshot.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePostReq();
    const res = await POST(req, params);
    expect(res.status).toBe(500);
  });
});
