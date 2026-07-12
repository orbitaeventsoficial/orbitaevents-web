import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetDownloadableExport } = vi.hoisted(() => ({
  mockGetDownloadableExport: vi.fn(),
}));

vi.mock('@/lib/services/privacyService', () => ({
  getDownloadableDataRequestExport: mockGetDownloadableExport,
}));

import { GET } from '@/app/api/privacy/download/route';

function makeReq(token?: string) {
  const url = token ? `http://localhost/api/privacy/download?token=${token}` : 'http://localhost/api/privacy/download';
  return new NextRequest(url);
}

describe('GET /api/privacy/download', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 sense token', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
    expect(mockGetDownloadableExport).not.toHaveBeenCalled();
  });

  it('retorna 404 si el servei no troba export descarregable', async () => {
    mockGetDownloadableExport.mockResolvedValue(null);
    const res = await GET(makeReq('tok-x'));
    expect(res.status).toBe(404);
    expect(mockGetDownloadableExport).toHaveBeenCalledWith('tok-x');
  });

  it('retorna el JSON descarregable quan el servei retorna dades', async () => {
    mockGetDownloadableExport.mockResolvedValue({
      id: 'req1',
      data: { name: 'Ana', email: 'ana@example.com' },
    });
    const res = await GET(makeReq('tok-x'));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('req1');
    const body = await res.json();
    expect(body).toEqual({ name: 'Ana', email: 'ana@example.com' });
  });
});
