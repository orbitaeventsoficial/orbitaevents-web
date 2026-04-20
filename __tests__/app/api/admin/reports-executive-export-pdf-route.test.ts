import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockBuildReport, mockExportPdf } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockBuildReport: vi.fn(),
  mockExportPdf: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/services/executiveReportService', () => ({
  buildExecutiveReport: mockBuildReport,
}));
vi.mock('@/lib/services/executiveReportPdfService', () => ({
  exportExecutiveReportPdf: mockExportPdf,
}));

import { GET } from '@/app/api/admin/reports/executive/export-pdf/route';

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/reports/executive/export-pdf');
}

describe('GET /api/admin/reports/executive/export-pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockBuildReport.mockResolvedValue({ generatedAt: '2026-04-17T10:00:00Z' });
    mockExportPdf.mockResolvedValue(new ArrayBuffer(8));
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

  it('retorna PDF amb headers correctes', async () => {
    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('informe-executiu-');
    expect(response.headers.get('Content-Disposition')).toContain('.pdf');
  });

  it('passa el report al exportador PDF', async () => {
    await GET(makeRequest());

    expect(mockBuildReport).toHaveBeenCalledOnce();
    expect(mockExportPdf).toHaveBeenCalledWith({ generatedAt: '2026-04-17T10:00:00Z' });
  });
});
