import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockListActivities, mockCreateActivity, mockCleanupDuplicates } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListActivities: vi.fn(),
  mockCreateActivity: vi.fn(),
  mockCleanupDuplicates: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/services/leadActivityService', () => ({
  listLeadActivities: mockListActivities,
  createLeadActivity: mockCreateActivity,
  cleanupDuplicateLeadActivities: mockCleanupDuplicates,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { GET, POST, DELETE } from '@/app/api/admin/leads/[id]/activities/route';

function makeGetReq(id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/activities`),
    params: { params: { id } },
  };
}

function makePostReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

function makeDeleteReq(id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/activities`, { method: 'DELETE' }),
    params: { params: { id } },
  };
}

describe('GET /api/admin/leads/[id]/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockListActivities.mockResolvedValue([{ id: 'act-1', title: 'Nota' }]);
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

  it('retorna activitats', async () => {
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 'act-1', title: 'Nota' }]);
  });

  it('passa id correcte al servei', async () => {
    const { req, params } = makeGetReq('lead-xyz');
    await GET(req, params);
    expect(mockListActivities).toHaveBeenCalledWith('lead-xyz');
  });

  it('retorna 500 si falla', async () => {
    mockListActivities.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/admin/leads/[id]/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockCreateActivity.mockResolvedValue({ id: 'act-2', title: 'Trucada' });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePostReq('lead-1', { title: 'Trucada' });
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  it('crea activitat correctament', async () => {
    const { req, params } = makePostReq('lead-1', { title: 'Trucada', type: 'CALL' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockCreateActivity).toHaveBeenCalledWith('lead-1', { title: 'Trucada', type: 'CALL' });
  });

  it('rebutja dades invàlides (title buit)', async () => {
    const { req, params } = makePostReq('lead-1', { title: '' });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja type invàlid', async () => {
    const { req, params } = makePostReq('lead-1', { title: 'Test', type: 'INVALID' });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockCreateActivity.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePostReq('lead-1', { title: 'Test' });
    const res = await POST(req, params);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/admin/leads/[id]/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockCleanupDuplicates.mockResolvedValue({ removed: 3 });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeDeleteReq();
    const res = await DELETE(req, params);
    expect(res.status).toBe(401);
  });

  it('neteja duplicats correctament', async () => {
    const { req, params } = makeDeleteReq('lead-1');
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    expect(mockCleanupDuplicates).toHaveBeenCalledWith('lead-1');
  });

  it('retorna 500 si falla', async () => {
    mockCleanupDuplicates.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makeDeleteReq();
    const res = await DELETE(req, params);
    expect(res.status).toBe(500);
  });
});
