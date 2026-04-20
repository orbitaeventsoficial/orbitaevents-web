import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequestId, mockLog, mockRunInvoiceSync, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn() },
  mockRunInvoiceSync: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/invoiceService', () => ({
  runInvoiceSyncCron: mockRunInvoiceSync,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/invoice-sync/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/invoice-sync', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/invoice-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-invoice');
    mockRunInvoiceSync.mockResolvedValue({ autoCreated: 2, retried: 1, refreshed: 5, errors: 0 });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'No autoritzat' });
    expect(mockRunInvoiceSync).not.toHaveBeenCalled();
  });

  it('rebutja Bearer token incorrecte', async () => {
    const res = await GET(makeRequest('wrong'));
    expect(res.status).toBe(401);
  });

  it('executa sync i guarda status ok', async () => {
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.summary).toEqual({ autoCreated: 2, retried: 1, refreshed: 5, errors: 0 });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.invoiceSync', status: 'ok' })
    );
  });

  it('guarda status error si falla', async () => {
    mockRunInvoiceSync.mockRejectedValueOnce(new Error('Connection lost'));
    const res = await GET(makeRequest('cron-secret'));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'Error executant cron' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'automation.invoiceSync', status: 'error', message: 'Connection lost' })
    );
  });
});
