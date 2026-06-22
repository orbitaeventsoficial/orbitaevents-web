import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockSendQuote } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockSendQuote: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/adminQuoteEmailService', () => ({ sendAdminQuoteEmail: mockSendQuote }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { POST } from '@/app/api/admin/emails/quote/route';

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/emails/quote', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/emails/quote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockSendQuote.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(makeReq({}))).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    expect((await POST(makeReq({ leadId: 'l1' }))).status).toBe(403);
    expect(mockSendQuote).not.toHaveBeenCalled();
  });

  it('envia pressupost per email', async () => {
    const res = await POST(makeReq({ leadId: 'l1', to: 'client@test.cat' }));
    expect(res.status).toBe(200);
    expect(mockSendQuote).toHaveBeenCalledWith({ leadId: 'l1', to: 'client@test.cat' });
  });

  it('passthrough status del servei', async () => {
    mockSendQuote.mockResolvedValueOnce({ status: 400, body: { error: 'Missing leadId' } });
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('retorna 400 si missing extras', async () => {
    mockSendQuote.mockRejectedValueOnce(new Error('Missing extras: Fotografia'));
    const res = await POST(makeReq({ leadId: 'l1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Missing extras');
  });

  it('retorna 504 si timeout SMTP', async () => {
    mockSendQuote.mockRejectedValueOnce(new Error('SMTP Timeout'));
    const res = await POST(makeReq({ leadId: 'l1' }));
    expect(res.status).toBe(504);
  });

  it('retorna 500 si error genèric', async () => {
    mockSendQuote.mockRejectedValueOnce(new Error('Unknown'));
    const res = await POST(makeReq({ leadId: 'l1' }));
    expect(res.status).toBe(500);
  });
});
