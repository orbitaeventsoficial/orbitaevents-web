import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetRequestId,
  mockLog,
  mockRunLeadReengagementAutomation,
  mockSaveCronRunStatus,
} = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: {
    error: vi.fn(),
    info: vi.fn(),
  },
  mockRunLeadReengagementAutomation: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({
  getRequestId: mockGetRequestId,
}));
vi.mock('@/lib/logger', () => ({
  log: mockLog,
}));
vi.mock('@/lib/services/tasks/leadReengagementAutomationService', () => ({
  runLeadReengagementAutomation: mockRunLeadReengagementAutomation,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/lead-reengagement/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/lead-reengagement', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/lead-reengagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-lead-reengagement');
    mockRunLeadReengagementAutomation.mockResolvedValue({
      candidates: 8,
      proposed: 6,
      created: 3,
      skipped: 3,
    });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token valid', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRunLeadReengagementAutomation).not.toHaveBeenCalled();
    expect(mockSaveCronRunStatus).not.toHaveBeenCalled();
  });

  it('executa reengagement automation i guarda summary', async () => {
    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, candidates: 8, proposed: 6, created: 3, skipped: 3 });
    expect(mockRunLeadReengagementAutomation).toHaveBeenCalledTimes(1);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'automation.leadReengagement',
      status: 'ok',
      summary: { candidates: 8, proposed: 6, created: 3, skipped: 3 },
      message: '3 tasques de reengagement creades de 6 propostes (3 duplicades, 8 candidats totals).',
      category: 'automation',
    });
  });

  it('guarda status error si falla', async () => {
    mockRunLeadReengagementAutomation.mockRejectedValueOnce(new Error('reengagement unavailable'));

    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: 'Cron lead-reengagement failed' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'automation.leadReengagement',
      status: 'error',
      summary: {},
      message: 'reengagement unavailable',
      category: 'automation',
    });
  });
});
