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
vi.mock('@/lib/services/proposalAdminService', () => {
  const roundMoney = (value: number) => Math.round(value * 100) / 100;
  class ProposalCanonicalDispatchError extends Error {
    public readonly status = 410;
    public readonly body = {
      ok: false,
      error: 'Els camps d’enviament del pressupost només es poden escriure des de /api/admin/proposals/:id/send.',
      canonicalRoute: '/api/admin/proposals/:id/send',
    };
  }
  class ProposalCanonicalAcceptanceError extends Error {
    public readonly status = 409;
    public readonly body = {
      ok: false,
      error: 'Només es pot acceptar un pressupost enviat amb PDF arxivat. Envia o repara el pressupost pel flux canònic abans d’acceptar-lo.',
      canonicalRoute: '/api/admin/proposals/:id/send',
    };
  }
  return {
    PROPOSAL_FINANCIAL_FIELDS: ['subtotal', 'discount', 'vatRate', 'vatAmount', 'total'] as const,
    ProposalCanonicalAcceptanceError,
    ProposalCanonicalDispatchError,
    getAdminProposalById: mockGetProposal,
    updateAdminProposal: mockUpdateProposal,
    deleteAdminProposal: vi.fn(),
    getProposalFinancialConsistencyIssues: (data: { subtotal: number; discount: number; vatRate: number; vatAmount: number; total: number }) => {
      const taxableBase = Math.max(0, roundMoney(data.subtotal - data.discount));
      const expectedVatAmount = roundMoney(taxableBase * (data.vatRate / 100));
      const expectedTotal = roundMoney(taxableBase + expectedVatAmount);
      const issues = [];
      if (Math.abs(roundMoney(data.vatAmount) - expectedVatAmount) > 0.01) {
        issues.push({ field: 'vatAmount', message: 'IVA incoherent amb subtotal, descompte i vatRate' });
      }
      if (Math.abs(roundMoney(data.total) - expectedTotal) > 0.01) {
        issues.push({ field: 'total', message: 'Total incoherent amb subtotal, descompte i IVA' });
      }
      return issues;
    },
  };
});
vi.mock('@/lib/services/automationTriggers', () => ({ dispatchAutoTrigger: mockDispatchAutoTrigger }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: () => 'test-req-id' }));
vi.mock('@prisma/client', () => ({
  ProposalStatus: { DRAFT: 'DRAFT', SENT: 'SENT', VIEWED: 'VIEWED', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED', EXPIRED: 'EXPIRED' },
}));

import { GET, PATCH } from '@/app/api/admin/proposals/[id]/route';
import { ProposalCanonicalAcceptanceError, ProposalCanonicalDispatchError } from '@/lib/services/proposalAdminService';

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
    mockUpdateProposal.mockResolvedValue({ status: 200, body: { proposal: { id: 'prop-1', status: 'DRAFT' } } });
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
    const { req, params } = makePatchReq('prop-1', { locale: 'ca' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    expect(mockUpdateProposal).toHaveBeenCalledWith('prop-1', { locale: 'ca' });
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
    const { req, params } = makePatchReq('prop-1', { locale: 'ca' });
    await PATCH(req, params);
    expect(mockDispatchAutoTrigger).not.toHaveBeenCalled();
  });

  it('rebutja actualització econòmica parcial', async () => {
    const { req, params } = makePatchReq('prop-1', { total: 500 });

    const res = await PATCH(req, params);

    expect(res.status).toBe(400);
    expect(mockUpdateProposal).not.toHaveBeenCalled();
  });

  it('rebutja totals econòmics incoherents', async () => {
    const { req, params } = makePatchReq('prop-1', {
      subtotal: 1000,
      discount: 0,
      vatRate: 21,
      vatAmount: 100,
      total: 1100,
    });

    const res = await PATCH(req, params);

    expect(res.status).toBe(400);
    expect(mockUpdateProposal).not.toHaveBeenCalled();
  });

  it('accepta bloc econòmic complet i coherent', async () => {
    const payload = {
      subtotal: 1000,
      discount: 100,
      vatRate: 21,
      vatAmount: 189,
      total: 1089,
    };
    const { req, params } = makePatchReq('prop-1', payload);

    const res = await PATCH(req, params);

    expect(res.status).toBe(200);
    expect(mockUpdateProposal).toHaveBeenCalledWith('prop-1', payload);
  });

  it('rebutja dades invàlides', async () => {
    const { req, params } = makePatchReq('prop-1', { validityDays: 0 });
    expect((await PATCH(req, params)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockUpdateProposal.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePatchReq('prop-1', { locale: 'ca' });
    expect((await PATCH(req, params)).status).toBe(500);
  });

  it('retorna 410 quan el servei rebutja camps de dispatch fora del carril canònic', async () => {
    mockUpdateProposal.mockRejectedValueOnce(new ProposalCanonicalDispatchError());
    const { req, params } = makePatchReq('prop-1', { status: 'SENT' });

    const res = await PATCH(req, params);
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body).toMatchObject({ canonicalRoute: '/api/admin/proposals/:id/send' });
  });

  it('accepta VIEWED al contracte de ruta però el servei el manté dins el carril canònic', async () => {
    mockUpdateProposal.mockRejectedValueOnce(new ProposalCanonicalDispatchError());
    const { req, params } = makePatchReq('prop-1', { status: 'VIEWED' });

    const res = await PATCH(req, params);
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body).toMatchObject({ canonicalRoute: '/api/admin/proposals/:id/send' });
    expect(mockUpdateProposal).toHaveBeenCalledWith('prop-1', { status: 'VIEWED' });
  });

  it('retorna 409 i no dispara contracte quan el servei rebutja acceptació no canònica', async () => {
    mockUpdateProposal.mockRejectedValueOnce(new ProposalCanonicalAcceptanceError());
    const { req, params } = makePatchReq('prop-1', { status: 'ACCEPTED' });

    const res = await PATCH(req, params);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toMatchObject({ canonicalRoute: '/api/admin/proposals/:id/send' });
    expect(mockDispatchAutoTrigger).not.toHaveBeenCalled();
  });
});
