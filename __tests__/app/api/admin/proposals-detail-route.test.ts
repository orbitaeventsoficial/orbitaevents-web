import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGetProposal, mockUpdateProposal, mockDispatchAutoTrigger } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetProposal: vi.fn(),
  mockUpdateProposal: vi.fn(),
  mockDispatchAutoTrigger: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/proposalAdminService', () => ({
  getAdminProposalById: mockGetProposal,
  updateAdminProposal: mockUpdateProposal,
}));
vi.mock('@/lib/services/automationTriggers', () => ({ dispatchAutoTrigger: mockDispatchAutoTrigger }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: () => 'test-req-id' }));
vi.mock('@prisma/client', () => ({
  ProposalStatus: { DRAFT: 'DRAFT', SENT: 'SENT', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED', EXPIRED: 'EXPIRED' },
}));

import { GET, PATCH } from '@/app/api/admin/proposals/[id]/route';

function makeGetReq(id = 'prop-1') {
  return { req: new NextRequest(`http://localhost/api/admin/proposals/${id}`), params: { params: { id } } };
}
function makePatchReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/proposals/${id}`, {
      method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('GET /api/admin/proposals/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockGetProposal.mockResolvedValue({ status: 200, body: { proposal: { id: 'prop-1', status: 'DRAFT' } } });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await GET(makeGetReq().req, makeGetReq().params)).status).toBe(401);
  });

  it('retorna pressupost', async () => {
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.proposal.id).toBe('prop-1');
  });

  it('passa id correcte', async () => {
    const { req, params } = makeGetReq('prop-xyz');
    await GET(req, params);
    expect(mockGetProposal).toHaveBeenCalledWith('prop-xyz');
  });

  it('retorna 404 si no existeix', async () => {
    mockGetProposal.mockResolvedValueOnce({ status: 404, body: { error: 'No trobat' } });
    const { req, params } = makeGetReq('inexistent');
    expect((await GET(req, params)).status).toBe(404);
  });

  it('retorna 500 si falla', async () => {
    mockGetProposal.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(makeGetReq().req, makeGetReq().params)).status).toBe(500);
  });
});

describe('PATCH /api/admin/proposals/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockUpdateProposal.mockResolvedValue({ status: 200, body: { proposal: { id: 'prop-1', status: 'SENT' } } });
    mockDispatchAutoTrigger.mockResolvedValue(undefined);
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await PATCH(makePatchReq('prop-1', { status: 'SENT' }).req, makePatchReq('prop-1', { status: 'SENT' }).params)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const { req, params } = makePatchReq('prop-1', { status: 'SENT' });
    expect((await PATCH(req, params)).status).toBe(403);
  });

  it('actualitza pressupost', async () => {
    const { req, params } = makePatchReq('prop-1', { status: 'SENT' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    expect(mockUpdateProposal).toHaveBeenCalledWith('prop-1', { status: 'SENT' });
  });

  it('dispara auto-trigger quan status ACCEPTED', async () => {
    const { req, params } = makePatchReq('prop-1', { status: 'ACCEPTED' });
    await PATCH(req, params);
    expect(mockDispatchAutoTrigger).toHaveBeenCalledWith({ type: 'proposal.accepted', proposalId: 'prop-1' });
  });

  it('dispara auto-trigger quan acceptedAt present', async () => {
    const { req, params } = makePatchReq('prop-1', { acceptedAt: '2026-04-18T10:00:00Z' });
    await PATCH(req, params);
    expect(mockDispatchAutoTrigger).toHaveBeenCalled();
  });

  it('no dispara auto-trigger per altres camps', async () => {
    const { req, params } = makePatchReq('prop-1', { total: 500 });
    await PATCH(req, params);
    expect(mockDispatchAutoTrigger).not.toHaveBeenCalled();
  });

  it('rebutja dades invàlides', async () => {
    const { req, params } = makePatchReq('prop-1', { validityDays: 0 });
    expect((await PATCH(req, params)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockUpdateProposal.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePatchReq('prop-1', { status: 'SENT' });
    expect((await PATCH(req, params)).status).toBe(500);
  });
});
