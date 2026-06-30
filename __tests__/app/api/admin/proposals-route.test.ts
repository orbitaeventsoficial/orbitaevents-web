import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockCreateProposal, mockListProposals } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreateProposal: vi.fn(),
  mockListProposals: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/proposalAdminService', () => {
  const roundMoney = (value: number) => Math.round(value * 100) / 100;
  return {
    createAdminProposal: mockCreateProposal,
    listAdminProposals: mockListProposals,
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
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: () => 'test-req-id' }));
vi.mock('@prisma/client', () => ({
  ProposalStatus: { DRAFT: 'DRAFT', SENT: 'SENT', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED', EXPIRED: 'EXPIRED' },
}));

import { POST } from '@/app/api/admin/proposals/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/proposals', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const basePayload = {
  customerId: 'cust-1',
  currency: 'EUR',
  validityDays: 15,
  subtotal: 1000,
  discount: 100,
  vatRate: 21,
  vatAmount: 189,
  total: 1089,
  snapshot: { packId: 'pack-1' },
};

describe('POST /api/admin/proposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCreateProposal.mockResolvedValue({ ok: true, proposal: { id: 'prop-1' } });
    mockListProposals.mockResolvedValue({ ok: true, proposals: [], pagination: { page: 1, limit: 50, total: 0, pages: 1 } });
  });

  it('crea proposta amb totals coherents', async () => {
    const res = await POST(makePostReq(basePayload));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(mockCreateProposal).toHaveBeenCalledWith(basePayload);
  });

  it('rebutja vatAmount incoherent', async () => {
    const res = await POST(makePostReq({ ...basePayload, vatAmount: 10, total: 910 }));

    expect(res.status).toBe(400);
    expect(mockCreateProposal).not.toHaveBeenCalled();
  });

  it('rebutja total incoherent', async () => {
    const res = await POST(makePostReq({ ...basePayload, total: 1000 }));

    expect(res.status).toBe(400);
    expect(mockCreateProposal).not.toHaveBeenCalled();
  });
});
