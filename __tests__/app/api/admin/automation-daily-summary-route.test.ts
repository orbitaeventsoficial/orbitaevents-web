import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockRunDaily } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRunDaily: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/commercialDailyAutomationService', () => ({
  runCommercialDailyAutomation: mockRunDaily,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: vi.fn().mockReturnValue('req-ds') }));

import { POST } from '@/app/api/admin/automation/daily-summary/run/route';

describe('POST /api/admin/automation/daily-summary/run', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockRunDaily.mockResolvedValue({ emailsSent: 1 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(401);
  });

  it('rebutja sense permission', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(403);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(403);
  });

  it('executa resum diari', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toEqual({ emailsSent: 1 });
  });

  it('retorna 500 si falla', async () => {
    mockRunDaily.mockRejectedValueOnce(new Error('SMTP'));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(500);
  });
});
