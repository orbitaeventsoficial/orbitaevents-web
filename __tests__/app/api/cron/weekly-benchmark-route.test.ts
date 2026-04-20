import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetRequestId,
  mockLog,
  mockRunWeeklyBenchmark,
  mockSaveCronRunStatus,
} = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: {
    error: vi.fn(),
    info: vi.fn(),
  },
  mockRunWeeklyBenchmark: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({
  getRequestId: mockGetRequestId,
}));
vi.mock('@/lib/logger', () => ({
  log: mockLog,
}));
vi.mock('@/lib/services/weeklyBenchmarkService', () => ({
  runWeeklyBenchmark: mockRunWeeklyBenchmark,
}));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  saveCronRunStatus: mockSaveCronRunStatus,
}));

import { GET } from '@/app/api/cron/weekly-benchmark/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/weekly-benchmark', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/weekly-benchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-weekly-benchmark');
    mockRunWeeklyBenchmark.mockResolvedValue({
      generatedAt: '2026-04-13T09:00:00.000Z',
      weekLabel: '06 abr – 13 abr 2026',
      metrics: [
        { label: 'Leads nous', current: 8, previous: 5, unit: '' },
      ],
      verdict: '✅ Setmana estable. Continua amb la rutina comercial i revisa les tasques pendents.',
    });
    mockSaveCronRunStatus.mockResolvedValue(undefined);
  });

  it('rebutja peticions sense Bearer token valid', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRunWeeklyBenchmark).not.toHaveBeenCalled();
    expect(mockSaveCronRunStatus).not.toHaveBeenCalled();
  });

  it('rebutja peticions amb Bearer token incorrecte', async () => {
    const response = await GET(makeRequest('wrong-secret'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: 'Unauthorized' });
    expect(mockRunWeeklyBenchmark).not.toHaveBeenCalled();
  });

  it('executa el benchmark setmanal i retorna el report', async () => {
    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.report).toEqual({
      generatedAt: '2026-04-13T09:00:00.000Z',
      weekLabel: '06 abr – 13 abr 2026',
      metrics: [
        { label: 'Leads nous', current: 8, previous: 5, unit: '' },
      ],
      verdict: '✅ Setmana estable. Continua amb la rutina comercial i revisa les tasques pendents.',
    });
    expect(mockRunWeeklyBenchmark).toHaveBeenCalledTimes(1);
    // Nota: el saveCronRunStatus 'ok' viu dins de weeklyBenchmarkService.runWeeklyBenchmark,
    // que aqui esta mockat. Per tant el route no crida saveCronRunStatus en el happy path.
    expect(mockSaveCronRunStatus).not.toHaveBeenCalled();
  });

  it('guarda status error si el benchmark falla', async () => {
    mockRunWeeklyBenchmark.mockRejectedValueOnce(new Error('prisma aggregate failed'));

    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: 'Weekly benchmark failed' });
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'benchmark.weekly',
      status: 'error',
      summary: {},
      message: 'prisma aggregate failed',
      category: 'config',
    });
    expect(mockLog.error).toHaveBeenCalledWith(
      'weekly-benchmark cron failed',
      expect.any(Error),
      {
        context: {
          requestId: 'req-weekly-benchmark',
          endpoint: 'cron/weekly-benchmark:GET',
        },
      }
    );
  });
});
