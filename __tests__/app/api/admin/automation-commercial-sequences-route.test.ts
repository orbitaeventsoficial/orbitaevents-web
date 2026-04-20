import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockReadMetrics, mockRunSequences } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockReadMetrics: vi.fn(),
  mockRunSequences: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/adminAutomationService', () => ({
  readCommercialSequenceMetrics: mockReadMetrics,
  runCommercialSequencesAutomation: mockRunSequences,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/request-context', () => ({ getRequestId: vi.fn().mockReturnValue('req-cs') }));

import { GET, POST } from '@/app/api/admin/automation/commercial-sequences/run/route';

describe('GET /api/admin/automation/commercial-sequences/run', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockReadMetrics.mockResolvedValue({ sent: 10, opened: 5 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/automation/commercial-sequences/run'))).status).toBe(401);
  });

  it('rebutja sense permission', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/automation/commercial-sequences/run'))).status).toBe(403);
  });

  it('retorna mètriques', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/automation/commercial-sequences/run'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.metrics30d).toEqual({ sent: 10, opened: 5 });
  });

  it('retorna 500 si falla', async () => {
    mockReadMetrics.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/api/admin/automation/commercial-sequences/run'))).status).toBe(500);
  });
});

describe('POST /api/admin/automation/commercial-sequences/run', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockRequirePermission.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockRunSequences.mockResolvedValue({ processed: 3, sent: 2 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST' });
    expect((await POST(req)).status).toBe(401);
  });

  it('rebutja sense permission automation', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST' });
    expect((await POST(req)).status).toBe(403);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const req = new NextRequest('http://localhost/x', { method: 'POST' });
    expect((await POST(req)).status).toBe(403);
  });

  it('executa seqüències i retorna summary', async () => {
    const req = new NextRequest('http://localhost/x', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toEqual({ processed: 3, sent: 2 });
  });

  it('retorna 500 si falla', async () => {
    mockRunSequences.mockRejectedValueOnce(new Error('fail'));
    const req = new NextRequest('http://localhost/x', { method: 'POST' });
    expect((await POST(req)).status).toBe(500);
  });
});
