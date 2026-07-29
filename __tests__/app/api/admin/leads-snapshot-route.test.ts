import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockProcessSnapshot } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockProcessSnapshot: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/services/leadSnapshotService', () => ({
  processLeadTechnicalSnapshot: mockProcessSnapshot,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { POST } from '@/app/api/admin/leads/[id]/snapshot/route';

function makePostReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/snapshot`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('POST /api/admin/leads/[id]/snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockProcessSnapshot.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePostReq('lead-1', { action: 'save_document' });
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  it('processa snapshot save_document', async () => {
    const { req, params } = makePostReq('lead-1', { action: 'save_document' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockProcessSnapshot).toHaveBeenCalledWith({
      leadId: 'lead-1',
      action: 'save_document',
      recipient: undefined,
    });
  });

  it('processa snapshot send_email amb recipient', async () => {
    const { req, params } = makePostReq('lead-1', { action: 'send_email', recipient: 'test@mail.com' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockProcessSnapshot).toHaveBeenCalledWith({
      leadId: 'lead-1',
      action: 'send_email',
      recipient: 'test@mail.com',
    });
  });

  it('rebutja action invàlida', async () => {
    const { req, params } = makePostReq('lead-1', { action: 'invalid_action' });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja recipient no email', async () => {
    const { req, params } = makePostReq('lead-1', { action: 'send_email', recipient: 'no-email' });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja body buit', async () => {
    const req = new NextRequest('http://localhost/api/admin/leads/lead-1/snapshot', {
      method: 'POST',
    });
    const res = await POST(req, { params: { id: 'lead-1' } });
    expect(res.status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockProcessSnapshot.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePostReq('lead-1', { action: 'save_document' });
    const res = await POST(req, params);
    expect(res.status).toBe(500);
  });
});
