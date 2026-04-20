import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockCheckRateLimit, mockSendTest } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockSendTest: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mockCheckRateLimit, RATE_LIMITS: { contact: { windowMs: 60000, limit: 5 } } }));
vi.mock('@/lib/services/adminTestNotificationService', () => ({ sendAdminTestEmail: mockSendTest }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { POST } from '@/app/api/admin/emails/test/route';

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/emails/test', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/emails/test', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockCheckRateLimit.mockResolvedValue(null); mockSendTest.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(makeReq({ email: 'a@b.cat' }))).status).toBe(401);
  });

  it('rebutja per rate limit', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429 }));
    expect((await POST(makeReq({ email: 'a@b.cat' }))).status).toBe(429);
  });

  it('rebutja email invàlid', async () => {
    const res = await POST(makeReq({ email: 'no-valid' }));
    expect(res.status).toBe(400);
  });

  it('rebutja sense email', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('envia test email correctament', async () => {
    const res = await POST(makeReq({ email: 'test@orbita.cat' }));
    expect(res.status).toBe(200);
    expect(mockSendTest).toHaveBeenCalledWith('test@orbita.cat');
  });

  it('retorna 500 si falla', async () => {
    mockSendTest.mockRejectedValueOnce(new Error('SMTP fail'));
    const res = await POST(makeReq({ email: 'a@b.cat' }));
    expect(res.status).toBe(500);
  });
});
