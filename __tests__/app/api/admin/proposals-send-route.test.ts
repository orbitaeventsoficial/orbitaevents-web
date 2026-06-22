import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockSendAdminProposal } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockSendAdminProposal: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/proposalDispatchService', () => ({ sendAdminProposal: mockSendAdminProposal }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: () => 'test-req-id' }));

import { POST } from '@/app/api/admin/proposals/[id]/send/route';

function makeReq(id = 'prop-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/proposals/${id}/send`, { method: 'POST' }),
    params: { params: { id } },
  };
}

describe('POST /api/admin/proposals/[id]/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockSendAdminProposal.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makeReq();
    expect((await POST(req, params)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const { req, params } = makeReq();
    expect((await POST(req, params)).status).toBe(403);
    expect(mockSendAdminProposal).not.toHaveBeenCalled();
  });

  it('envia el pressupost', async () => {
    const { req, params } = makeReq('prop-42');
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockSendAdminProposal).toHaveBeenCalledWith('prop-42');
  });

  it('passthrough status del servei', async () => {
    mockSendAdminProposal.mockResolvedValueOnce({ status: 400, body: { ok: false, error: 'Sense client' } });
    const { req, params } = makeReq();
    expect((await POST(req, params)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockSendAdminProposal.mockRejectedValueOnce(new Error('SMTP'));
    const { req, params } = makeReq();
    expect((await POST(req, params)).status).toBe(500);
  });
});
