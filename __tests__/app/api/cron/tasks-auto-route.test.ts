import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetRequestId,
  mockLog,
  mockRunTaskAutomation,
  mockSaveCronRunStatus,
} = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: {
    error: vi.fn(),
    info: vi.fn(),
  },
  mockRunTaskAutomation: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({
  getRequestId: mockGetRequestId,
}));
vi.mock('@/lib/logger', () => ({
  log: mockLog,
}));
vi.mock('@/lib/services/tasks/taskAutomationService', () => ({
  runTaskAutomation: mockRunTaskAutomation,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/tasks-auto/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/tasks-auto', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/tasks-auto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-tasks-auto');
    mockRunTaskAutomation.mockResolvedValue({
      proposed: 9,
      created: 4,
      skipped: 5,
      proposals: [{ id: 'not-persisted-in-summary' }],
    });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token valid', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRunTaskAutomation).not.toHaveBeenCalled();
    expect(mockSaveCronRunStatus).not.toHaveBeenCalled();
  });

  it('executa task automation i guarda un summary compacte', async () => {
    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, proposed: 9, created: 4, skipped: 5 });
    expect(mockRunTaskAutomation).toHaveBeenCalledTimes(1);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'automation.tasks',
      status: 'ok',
      summary: { proposed: 9, created: 4, skipped: 5 },
      message: '4 tasques creades de 9 propostes (5 duplicades)',
      category: 'automation',
    });
    expect(mockLog.info).toHaveBeenCalledWith('tasks-auto cron completed', {
      context: {
        requestId: 'req-tasks-auto',
        proposed: 9,
        created: 4,
        skipped: 5,
      },
    });
  });

  it('guarda status error si falla task automation', async () => {
    mockRunTaskAutomation.mockRejectedValueOnce(new Error('task automation unavailable'));

    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: 'Cron tasks-auto failed' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'automation.tasks',
      status: 'error',
      summary: {},
      message: 'task automation unavailable',
      category: 'automation',
    });
    expect(mockLog.error).toHaveBeenCalledWith(
      'tasks-auto cron failed',
      expect.any(Error),
      {
        context: {
          requestId: 'req-tasks-auto',
          endpoint: 'cron/tasks-auto:GET',
        },
      }
    );
  });
});
