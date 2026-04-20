import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetRequestId,
  mockLog,
  mockRunUrgentFollowUpAlerts,
  mockSaveCronRunStatus,
} = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn() },
  mockRunUrgentFollowUpAlerts: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/urgentFollowUpAlertService', () => ({
  runUrgentFollowUpAlerts: mockRunUrgentFollowUpAlerts,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/urgent-followup-alerts/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/urgent-followup-alerts', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

const mockResult = {
  generatedAt: '2026-04-17T10:00:00.000Z',
  urgentDetected: 3,
  newAlerts: 2,
  alreadyAlerted: 1,
  emailSent: true,
  whatsappSent: true,
  items: [
    { leadId: 'l1', name: 'Lead 1', daysSinceOutbound: 6 },
    { leadId: 'l2', name: 'Lead 2', daysSinceOutbound: 8 },
  ],
};

describe('GET /api/cron/urgent-followup-alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-urgent');
    mockRunUrgentFollowUpAlerts.mockResolvedValue(mockResult);
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRunUrgentFollowUpAlerts).not.toHaveBeenCalled();
  });

  it('rebutja Bearer token incorrecte', async () => {
    const response = await GET(makeRequest('wrong-secret'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
  });

  it('executa alertes i retorna resultat amb alertes noves', async () => {
    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.newAlerts).toBe(2);
    expect(body.urgentDetected).toBe(3);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'alerts.urgentFollowUp',
        status: 'ok',
        message: expect.stringContaining('2 alertes enviades'),
      })
    );
  });

  it('retorna missatge adequat sense alertes noves', async () => {
    mockRunUrgentFollowUpAlerts.mockResolvedValue({
      ...mockResult,
      newAlerts: 0,
      alreadyAlerted: 3,
    });

    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('0 alertes noves'),
      })
    );
  });

  it('guarda status error si falla el servei', async () => {
    mockRunUrgentFollowUpAlerts.mockRejectedValueOnce(new Error('DB down'));

    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: 'Cron urgent-followup-alerts failed' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'alerts.urgentFollowUp',
        status: 'error',
        message: 'DB down',
      })
    );
  });
});
