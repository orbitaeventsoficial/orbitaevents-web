import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockUpdatePrefs } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockUpdatePrefs: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/customerSegmentationService', () => ({ updateCustomerPreferences: mockUpdatePrefs }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { PATCH } from '@/app/api/admin/customers/[id]/preferences/route';

const ctx = { params: { id: 'c1' } };
function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/x', { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

describe('PATCH /api/admin/customers/[id]/preferences', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpdatePrefs.mockResolvedValue({ preferences: { musicStyles: ['pop'] } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await PATCH(makeReq({}), ctx)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    expect((await PATCH(makeReq({}), ctx)).status).toBe(403);
  });

  it('actualitza preferències', async () => {
    const res = await PATCH(makeReq({ musicStyles: ['pop', 'jazz'] }), ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockUpdatePrefs).toHaveBeenCalledWith('c1', { musicStyles: ['pop', 'jazz'] });
  });

  it('rebutja dades Zod invàlides', async () => {
    const res = await PATCH(makeReq({ specialNeeds: 'x'.repeat(501) }), ctx);
    expect(res.status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockUpdatePrefs.mockRejectedValueOnce(new Error('DB'));
    expect((await PATCH(makeReq({ notes: 'ok' }), ctx)).status).toBe(500);
  });
});
