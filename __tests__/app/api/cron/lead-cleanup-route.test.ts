import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequestId, mockLog, mockRunLeadCleanup, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn() },
  mockRunLeadCleanup: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/leadCleanupService', () => ({
  runLeadCleanup: mockRunLeadCleanup,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/lead-cleanup/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/lead-cleanup', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/lead-cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-cleanup');
    mockRunLeadCleanup.mockResolvedValue({ archived: 3, deleted: 1 });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRunLeadCleanup).not.toHaveBeenCalled();
  });

  it('rebutja Bearer token incorrecte', async () => {
    const res = await GET(makeRequest('wrong'));
    expect(res.status).toBe(401);
  });

  it('executa cleanup i guarda status ok', async () => {
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toEqual({ archived: 3, deleted: 1 });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'lead-cleanup', status: 'ok', summary: JSON.stringify({ archived: 3, deleted: 1 }) })
    );
  });

  it('guarda status error si falla', async () => {
    mockRunLeadCleanup.mockRejectedValueOnce(new Error('Timeout'));
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'Error executant lead cleanup' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'lead-cleanup', status: 'error', summary: 'Timeout' })
    );
  });
});
