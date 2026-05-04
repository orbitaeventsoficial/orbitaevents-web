import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockRunCommercialSequenceForLead } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRunCommercialSequenceForLead: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/services/commercialSequenceService', () => ({
  runCommercialSequenceForLead: mockRunCommercialSequenceForLead,
}));

import { POST } from '@/app/api/admin/leads/[id]/sequence/route';

describe('POST /api/admin/leads/[id]/sequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockRunCommercialSequenceForLead.mockResolvedValue({
      ok: true,
      leadId: 'lead-1',
      channel: 'email',
      step: 2,
      totalSteps: 5,
      templateSlug: 'follow-up-2',
      locale: 'ca',
      nurturingStep: 2,
      nurturingDone: false,
    });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const req = new NextRequest('http://localhost/api/admin/leads/lead-1/sequence', { method: 'POST' });
    expect((await POST(req, { params: { id: 'lead-1' } })).status).toBe(401);
  });

  it('rebutja sense permission automation', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/leads/lead-1/sequence', { method: 'POST' });
    expect((await POST(req, { params: { id: 'lead-1' } })).status).toBe(403);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/leads/lead-1/sequence', { method: 'POST' });
    expect((await POST(req, { params: { id: 'lead-1' } })).status).toBe(403);
  });

  it('executa la seqüència manual i retorna summary', async () => {
    const req = new NextRequest('http://localhost/api/admin/leads/lead-1/sequence', {
      method: 'POST',
      body: JSON.stringify({ step: 2 }),
    });

    const res = await POST(req, { params: { id: 'lead-1' } });

    expect(res.status).toBe(200);
    expect(mockRunCommercialSequenceForLead).toHaveBeenCalledWith('lead-1', { step: 2 });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      summary: expect.objectContaining({ leadId: 'lead-1', step: 2 }),
    });
  });

  it('propaga errors de domini amb el seu status', async () => {
    mockRunCommercialSequenceForLead.mockResolvedValueOnce({
      ok: false,
      status: 409,
      error: 'La seqüència manual només es pot executar sobre leads actius',
    });
    const req = new NextRequest('http://localhost/api/admin/leads/lead-1/sequence', {
      method: 'POST',
      body: JSON.stringify({ step: 5 }),
    });

    const res = await POST(req, { params: { id: 'lead-1' } });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'La seqüència manual només es pot executar sobre leads actius',
    });
  });
});
