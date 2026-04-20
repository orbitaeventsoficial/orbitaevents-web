import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockGetSnapshot, mockEnforceSla } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetSnapshot: vi.fn(),
  mockEnforceSla: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/slaAutomationService', () => ({ getSlaSnapshot: mockGetSnapshot }));
vi.mock('@/lib/services/adminAutomationService', () => ({ enforceSlaAutomation: mockEnforceSla }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { GET, POST } from '@/app/api/admin/automation/enforce-sla/route';

describe('GET /api/admin/automation/enforce-sla', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockGetSnapshot.mockResolvedValue({ violations: 2, healthy: 8 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(401);
  });

  it('retorna snapshot SLA', async () => {
    const res = await GET(new NextRequest('http://localhost/x'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.violations).toBe(2);
    expect(body.healthy).toBe(8);
  });

  it('retorna 500 si falla', async () => {
    mockGetSnapshot.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/x'))).status).toBe(500);
  });
});

describe('POST /api/admin/automation/enforce-sla', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockEnforceSla.mockResolvedValue({ enforced: 3, escalated: 1 }); });

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

  it('executa SLA i retorna summary', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.enforced).toBe(3);
  });

  it('retorna 500 si falla', async () => {
    mockEnforceSla.mockRejectedValueOnce(new Error('fail'));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(500);
  });
});
