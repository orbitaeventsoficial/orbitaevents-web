import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockHandleLeadQuoteGet, mockHandleLeadQuotePost } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockHandleLeadQuoteGet: vi.fn(),
  mockHandleLeadQuotePost: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/leads/quoteRouteHandler', () => ({
  handleLeadQuoteGet: mockHandleLeadQuoteGet,
  handleLeadQuotePost: mockHandleLeadQuotePost,
}));

import { GET, POST } from '@/app/api/admin/leads/[id]/quote/route';

function makeReq(method: 'GET' | 'POST', id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/quote`, { method }),
    params: { params: { id } },
  };
}

describe('GET /api/admin/leads/[id]/quote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockHandleLeadQuoteGet.mockResolvedValue(Response.json({ ok: true }));
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makeReq('GET');
    expect((await GET(req, params)).status).toBe(401);
    expect(mockHandleLeadQuoteGet).not.toHaveBeenCalled();
  });

  it('delegua GET sense exigir CSRF', async () => {
    const { req, params } = makeReq('GET', 'lead-42');
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockHandleLeadQuoteGet).toHaveBeenCalledWith(req, 'lead-42');
  });
});

describe('POST /api/admin/leads/[id]/quote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockHandleLeadQuotePost.mockResolvedValue(Response.json({ ok: true }));
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makeReq('POST');
    expect((await POST(req, params)).status).toBe(401);
    expect(mockHandleLeadQuotePost).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const { req, params } = makeReq('POST');
    expect((await POST(req, params)).status).toBe(403);
    expect(mockHandleLeadQuotePost).not.toHaveBeenCalled();
  });

  it('delegua POST amb CSRF valid', async () => {
    const { req, params } = makeReq('POST', 'lead-42');
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockHandleLeadQuotePost).toHaveBeenCalledWith(req, 'lead-42');
  });
});
