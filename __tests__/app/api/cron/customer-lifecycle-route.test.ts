import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetRequestId,
  mockLog,
  mockRecalculateAllCustomers,
  mockSaveCronRunStatus,
} = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: {
    error: vi.fn(),
    info: vi.fn(),
  },
  mockRecalculateAllCustomers: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({
  getRequestId: mockGetRequestId,
}));
vi.mock('@/lib/logger', () => ({
  log: mockLog,
}));
vi.mock('@/lib/services/customerSegmentationService', () => ({
  recalculateAllCustomers: mockRecalculateAllCustomers,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/customer-lifecycle/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/customer-lifecycle', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/customer-lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-customer-lifecycle');
    mockRecalculateAllCustomers.mockResolvedValue({
      processed: 12,
      lifecycleChanges: 3,
      healthUpdates: 7,
    });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token valid', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRecalculateAllCustomers).not.toHaveBeenCalled();
    expect(mockSaveCronRunStatus).not.toHaveBeenCalled();
  });

  it('recalcula lifecycle i healthScore i guarda status del cron', async () => {
    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      processed: 12,
      lifecycleChanges: 3,
      healthUpdates: 7,
    });
    expect(mockRecalculateAllCustomers).toHaveBeenCalledTimes(1);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'crm.customer-lifecycle',
      status: 'ok',
      summary: {
        processed: 12,
        lifecycleChanges: 3,
        healthUpdates: 7,
      },
      message: '12 clients processats, 3 canvis lifecycle, 7 scores actualitzats',
      category: 'config',
    });
    expect(mockLog.info).toHaveBeenCalledWith('customer-lifecycle cron completed', {
      context: {
        requestId: 'req-customer-lifecycle',
        processed: 12,
        lifecycleChanges: 3,
        healthUpdates: 7,
      },
    });
  });

  it('guarda status error si falla el recalcul', async () => {
    mockRecalculateAllCustomers.mockRejectedValueOnce(new Error('database unavailable'));

    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: 'Cron customer-lifecycle failed' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'crm.customer-lifecycle',
      status: 'error',
      summary: {},
      message: 'database unavailable',
      category: 'config',
    });
    expect(mockLog.error).toHaveBeenCalledWith(
      'customer-lifecycle cron failed',
      expect.any(Error),
      {
        context: {
          requestId: 'req-customer-lifecycle',
          endpoint: 'cron/customer-lifecycle:GET',
        },
      }
    );
  });
});
