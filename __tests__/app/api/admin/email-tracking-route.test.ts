import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockLoadEmailTrackingReport } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockLoadEmailTrackingReport: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock('@/lib/services/emailTrackingService', () => ({
  loadEmailTrackingReport: mockLoadEmailTrackingReport,
}));

import { GET } from '@/app/api/admin/email-tracking/route';

function makeRequest(url = 'http://localhost/api/admin/email-tracking?days=90') {
  return new NextRequest(url);
}

describe('GET /api/admin/email-tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockLoadEmailTrackingReport.mockResolvedValue({
      generatedAt: '2026-04-16T19:00:00.000Z',
      windowDays: 90,
      totalSent: 12,
      totalOpened: 8,
      totalClicked: 3,
      totalReplied: 2,
      globalOpenRate: 67,
      globalClickRate: 25,
      globalReplyRate: 17,
      byTemplate: [],
      bestPerformer: null,
      worstPerformer: null,
    });
  });

  it('rebutja la petició si requireAuth retorna error', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(mockLoadEmailTrackingReport).not.toHaveBeenCalled();
  });

  it('retorna el report per defecte amb finestra de 90 dies', async () => {
    const response = await GET(makeRequest('http://localhost/api/admin/email-tracking'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockLoadEmailTrackingReport).toHaveBeenCalledWith(90);
    expect(body.totalSent).toBe(12);
    expect(body.windowDays).toBe(90);
  });

  it('normalitza valors de days invàlids al default de 90', async () => {
    await GET(makeRequest('http://localhost/api/admin/email-tracking?days=-10'));
    expect(mockLoadEmailTrackingReport).toHaveBeenCalledWith(90);
  });

  it('retorna 500 si el servei falla', async () => {
    mockLoadEmailTrackingReport.mockRejectedValueOnce(new Error('db failed'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Error carregant report de tracking' });
    spy.mockRestore();
  });
});
