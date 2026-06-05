import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequestId, mockLog, mockReconcile, mockSaveCronRunStatus } = vi.hoisted(() => ({
  mockGetRequestId: vi.fn(),
  mockLog: { error: vi.fn(), info: vi.fn() },
  mockReconcile: vi.fn(),
  mockSaveCronRunStatus: vi.fn(),
}));

vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: mockLog }));
vi.mock('@/lib/services/googleCalendarSyncService', () => ({ reconcileGoogleCalendar: mockReconcile }));
vi.mock('@/lib/services/cronRunStatusService', () => ({ saveCronRunStatus: mockSaveCronRunStatus }));

import { GET } from '@/app/api/cron/calendar-sync/route';

function makeRequest(token?: string) {
  return new NextRequest('http://localhost/api/cron/calendar-sync', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

describe('GET /api/cron/calendar-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'cron-secret';
    mockGetRequestId.mockReturnValue('req-calendar-sync');
    mockSaveCronRunStatus.mockResolvedValue(undefined);
    mockReconcile.mockResolvedValue({
      connected: true,
      desired: 31,
      synced: 31,
      deleted: 0,
      failed: 0,
      skipped: 0,
    });
  });

  it('rebutja peticions sense Bearer token valid', async () => {
    const response = await GET(makeRequest());
    expect(response.status).toBe(401);
    expect(mockReconcile).not.toHaveBeenCalled();
  });

  it('reconcilia tot i desa observabilitat del cron', async () => {
    const response = await GET(makeRequest('cron-secret'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'automation.calendarSync',
      status: 'ok',
      summary: body.summary,
      message: '31 events sincronitzats, 0 eliminats, 0 errors',
      category: 'automation',
    });
  });

  it('manté el cron verd però informa que falta connectar OAuth', async () => {
    mockReconcile.mockResolvedValueOnce({
      connected: false,
      desired: 31,
      synced: 0,
      deleted: 0,
      failed: 0,
      skipped: 31,
    });

    const response = await GET(makeRequest('cron-secret'));

    expect(response.status).toBe(200);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ok',
      message: 'Google Calendar pendent de connexió OAuth',
    }));
  });

  it('retorna error i el registra quan falla la reconciliació', async () => {
    mockReconcile.mockRejectedValueOnce(new Error('Google unavailable'));

    const response = await GET(makeRequest('cron-secret'));

    expect(response.status).toBe(500);
    expect(mockSaveCronRunStatus).toHaveBeenCalledWith({
      prefix: 'automation.calendarSync',
      status: 'error',
      summary: {},
      message: 'Google unavailable',
      category: 'automation',
    });
  });
});
