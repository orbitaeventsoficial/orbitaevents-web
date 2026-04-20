import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequestId, mockLog, mockRunFuelDaily, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn() },
  mockRunFuelDaily: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/fuelReferenceService', () => ({
  runFuelDailyRefresh: mockRunFuelDaily,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/fuel-daily/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/fuel-daily', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/fuel-daily', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-fuel');
    mockRunFuelDaily.mockResolvedValue({ updated: 12, skipped: 0 });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRunFuelDaily).not.toHaveBeenCalled();
  });

  it('rebutja Bearer token incorrecte', async () => {
    const res = await GET(makeRequest('wrong'));
    expect(res.status).toBe(401);
  });

  it('executa refresh i guarda status ok', async () => {
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toEqual({ updated: 12, skipped: 0 });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.fuel', status: 'ok', category: 'finance' })
    );
  });

  it('guarda status error si falla', async () => {
    mockRunFuelDaily.mockRejectedValueOnce(new Error('API timeout'));
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'Cron fuel-daily failed' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.fuel', status: 'error', message: 'API timeout', category: 'finance' })
    );
  });
});
