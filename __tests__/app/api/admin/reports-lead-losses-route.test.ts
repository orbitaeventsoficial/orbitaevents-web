import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockLoadLossReport } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockLoadLossReport: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/services/leadLossAnalyticsService', () => ({
  loadLossReport: mockLoadLossReport,
}));

import { GET } from '@/app/api/admin/reports/lead-losses/route';

function makeRequest(query: string = '') {
  return new NextRequest(`http://localhost/api/admin/reports/lead-losses${query}`);
}

function fakeSummary() {
  return {
    total: 2,
    uncategorized: 0,
    byReason: [
      { key: 'PRICE_TOO_HIGH' as const, label: 'Preu massa alt', count: 2, share: 100 },
    ],
    byEventType: [{ key: 'WEDDING', label: 'Wedding', count: 2, share: 100 }],
    bySource: [{ key: 'WEBSITE', label: 'Website', count: 2, share: 100 }],
    byMonth: [{ monthIso: '2026-04', count: 2 }],
    topReason: {
      reason: 'PRICE_TOO_HIGH' as const,
      label: 'Preu massa alt',
      count: 2,
      share: 100,
    },
  };
}

describe('GET /api/admin/reports/lead-losses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockLoadLossReport.mockResolvedValue(fakeSummary());
  });

  it('rebutja si requireAuth retorna error', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(mockLoadLossReport).not.toHaveBeenCalled();
  });

  it('rebutja si requirePermission retorna error', async () => {
    mockRequirePermission.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    );

    const response = await GET(makeRequest());

    expect(response.status).toBe(403);
    expect(mockLoadLossReport).not.toHaveBeenCalled();
  });

  it('usa finestra per defecte de 90 dies quan no hi ha ?days', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.sinceDays).toBe(90);
    expect(mockLoadLossReport).toHaveBeenCalledWith({ sinceDays: 90 });
    expect(body.summary.total).toBe(2);
    expect(body.summary.topReason.reason).toBe('PRICE_TOO_HIGH');
  });

  it('accepta ?days=30 i el passa al servei', async () => {
    const response = await GET(makeRequest('?days=30'));
    const body = await response.json();

    expect(body.sinceDays).toBe(30);
    expect(mockLoadLossReport).toHaveBeenCalledWith({ sinceDays: 30 });
  });

  it('capa ?days a 365 dies màxim', async () => {
    const response = await GET(makeRequest('?days=9999'));
    const body = await response.json();

    expect(body.sinceDays).toBe(365);
    expect(mockLoadLossReport).toHaveBeenCalledWith({ sinceDays: 365 });
  });

  it('capa ?days a 1 dia mínim', async () => {
    const response = await GET(makeRequest('?days=0'));
    const body = await response.json();

    expect(body.sinceDays).toBe(1);
    expect(mockLoadLossReport).toHaveBeenCalledWith({ sinceDays: 1 });
  });

  it('ignora ?days no numèric i usa el default', async () => {
    const response = await GET(makeRequest('?days=abc'));
    const body = await response.json();

    expect(body.sinceDays).toBe(90);
    expect(mockLoadLossReport).toHaveBeenCalledWith({ sinceDays: 90 });
  });

  it('retorna ok:true amb sinceDays i summary complet', async () => {
    const response = await GET(makeRequest('?days=60'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      sinceDays: 60,
      summary: fakeSummary(),
    });
  });
});
