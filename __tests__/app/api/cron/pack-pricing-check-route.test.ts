import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequestId, mockLog, mockRunPackPricingCheck, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn() },
  mockRunPackPricingCheck: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/packPricingCheckService', () => ({
  runPackPricingCheck: mockRunPackPricingCheck,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/pack-pricing-check/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/pack-pricing-check', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/pack-pricing-check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-pricing');
    mockRunPackPricingCheck.mockResolvedValue({ checked: 10, anomalies: 2 });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRunPackPricingCheck).not.toHaveBeenCalled();
  });

  it('rebutja Bearer token incorrecte', async () => {
    const res = await GET(makeRequest('wrong'));
    expect(res.status).toBe(401);
  });

  it('executa check i retorna resultat spread', async () => {
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.checked).toBe(10);
    expect(body.anomalies).toBe(2);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.packPricing', status: 'ok' })
    );
  });

  it('guarda status error si falla', async () => {
    mockRunPackPricingCheck.mockRejectedValueOnce(new Error('Calc error'));
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'Pack pricing check failed' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.packPricing', status: 'error', message: 'Calc error' })
    );
  });
});
