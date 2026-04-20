import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockBuildReport, mockExportCsv } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockBuildReport: vi.fn(),
  mockExportCsv: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/services/executiveReportService', () => ({
  buildExecutiveReport: mockBuildReport,
  exportExecutiveReportCsv: mockExportCsv,
}));

import { GET } from '@/app/api/admin/reports/executive/export/route';

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/reports/executive/export');
}

describe('GET /api/admin/reports/executive/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockBuildReport.mockResolvedValue({ generatedAt: '2026-04-17T10:00:00Z' });
    mockExportCsv.mockReturnValue('Informe executiu\nClients,120');
  });

  it('rebutja si requireAuth retorna error', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );

    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
    expect(mockBuildReport).not.toHaveBeenCalled();
  });

  it('rebutja si requirePermission retorna error', async () => {
    mockRequirePermission.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    );

    const response = await GET(makeRequest());

    expect(response.status).toBe(403);
    expect(mockBuildReport).not.toHaveBeenCalled();
  });

  it('retorna CSV amb headers correctes', async () => {
    const response = await GET(makeRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('informe-executiu-');
    expect(response.headers.get('Content-Disposition')).toContain('.csv');
    expect(body).toContain('Informe executiu');
    expect(body).toContain('Clients,120');
  });

  it('passa el report al exportador CSV', async () => {
    await GET(makeRequest());

    expect(mockBuildReport).toHaveBeenCalledOnce();
    expect(mockExportCsv).toHaveBeenCalledWith({ generatedAt: '2026-04-17T10:00:00Z' });
  });
});
