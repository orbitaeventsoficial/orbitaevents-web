import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyBasic, mockProcess } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyBasic: vi.fn(),
  mockProcess: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, verifyBasicAuth: mockVerifyBasic }));
vi.mock('@/lib/services/privacyRequestAdminService', () => ({ processPrivacyRequestById: mockProcess }));

import { POST } from '@/app/api/admin/privacy/requests/[id]/process/route';

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/x', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

describe('POST /api/admin/privacy/requests/[id]/process', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyBasic.mockReturnValue({ authenticated: false }); mockProcess.mockResolvedValue({ status: 200, body: { ok: true } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await POST(makeReq({ action: 'approve' }), { params: Promise.resolve({ id: 'r1' }) })).status).toBe(401);
  });

  it('aprova sol·licitud', async () => {
    const res = await POST(makeReq({ action: 'approve', notes: 'OK' }), { params: Promise.resolve({ id: 'r1' }) });
    expect(res.status).toBe(200);
    expect(mockProcess).toHaveBeenCalledWith('r1', 'approve', 'OK', 'admin');
  });

  it('rebutja sol·licitud', async () => {
    await POST(makeReq({ action: 'reject' }), { params: Promise.resolve({ id: 'r1' }) });
    expect(mockProcess).toHaveBeenCalledWith('r1', 'reject', undefined, 'admin');
  });

  it('rebutja acció invàlida', async () => {
    expect((await POST(makeReq({ action: 'invalid' }), { params: Promise.resolve({ id: 'r1' }) })).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockProcess.mockRejectedValueOnce(new Error('DB'));
    expect((await POST(makeReq({ action: 'approve' }), { params: Promise.resolve({ id: 'r1' }) })).status).toBe(500);
  });
});
