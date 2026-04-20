import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockLoadSocialPerformanceReport } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockLoadSocialPerformanceReport: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/services/socialPerformanceService', () => ({
  loadSocialPerformanceReport: mockLoadSocialPerformanceReport,
}));

import { GET } from '@/app/api/admin/social-posts/performance/route';

function makeRequest(url = 'http://localhost/api/admin/social-posts/performance') {
  return new NextRequest(url);
}

const mockReport = {
  generatedAt: '2026-04-17T10:00:00.000Z',
  windowDays: 90,
  totalPosts: 15,
  totalPublished: 10,
  overallAvgPerWeek: 0.78,
  platformMetrics: [],
  consistencyScore: 65,
  recommendations: ['Diversifica contingut'],
};

describe('GET /api/admin/social-posts/performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockLoadSocialPerformanceReport.mockResolvedValue(mockReport);
  });

  it('rebutja si requireAuth retorna error', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(mockLoadSocialPerformanceReport).not.toHaveBeenCalled();
  });

  it('retorna report amb finestra per defecte de 90 dies', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockLoadSocialPerformanceReport).toHaveBeenCalledWith(90);
    expect(body.totalPosts).toBe(15);
    expect(body.consistencyScore).toBe(65);
  });

  it('accepta parametre days custom', async () => {
    await GET(makeRequest('http://localhost/api/admin/social-posts/performance?days=30'));

    expect(mockLoadSocialPerformanceReport).toHaveBeenCalledWith(30);
  });

  it('retorna recomanacions al report', async () => {
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(body.recommendations).toEqual(['Diversifica contingut']);
  });
});
