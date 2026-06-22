import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockEnsureCoverageAreasSetting, mockUpdateCoverageAreas } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockEnsureCoverageAreasSetting: vi.fn(),
  mockUpdateCoverageAreas: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/coverage', () => ({
  ensureCoverageAreasSetting: mockEnsureCoverageAreasSetting,
  updateCoverageAreas: mockUpdateCoverageAreas,
}));

import { GET, POST } from '@/app/api/admin/coverage/route';

function req(method: string, body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/admin/coverage', {
    method,
    headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('/api/admin/coverage route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockEnsureCoverageAreasSetting.mockResolvedValue([{ city: 'Mataro', province: 'Barcelona', enabled: true }]);
    mockUpdateCoverageAreas.mockResolvedValue({
      status: 200,
      body: { areas: [{ city: 'Mataro', province: 'Barcelona', enabled: true }] },
    });
  });

  it('GET retorna cobertura sense validar CSRF', async () => {
    const res = await GET(req('GET'));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      areas: [{ city: 'Mataro', province: 'Barcelona', enabled: true }],
    });
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockEnsureCoverageAreasSetting).toHaveBeenCalledWith(expect.objectContaining({
      label: expect.any(String),
      description: expect.any(String),
    }));
  });

  it('POST rebutja sense auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('Unauthorized', { status: 401 }));
    const res = await POST(req('POST', { action: 'add', city: 'Mataro', province: 'Barcelona' }));
    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockUpdateCoverageAreas).not.toHaveBeenCalled();
  });

  it('POST rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const res = await POST(req('POST', { action: 'add', city: 'Mataro', province: 'Barcelona' }));
    expect(res.status).toBe(403);
    expect(mockUpdateCoverageAreas).not.toHaveBeenCalled();
  });

  it('POST valida action i city abans de cridar el servei', async () => {
    const res = await POST(req('POST', { action: 'add' }));
    expect(res.status).toBe(400);
    expect(mockUpdateCoverageAreas).not.toHaveBeenCalled();
  });

  it('POST afegeix una ciutat amb CSRF validat', async () => {
    const res = await POST(req('POST', { action: 'add', city: 'Mataro', province: 'Barcelona', enabled: true }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.areas).toEqual([{ city: 'Mataro', province: 'Barcelona', enabled: true }]);
    expect(mockVerifyCsrf).toHaveBeenCalledTimes(1);
    expect(mockUpdateCoverageAreas).toHaveBeenCalledWith(expect.objectContaining({
      action: 'add',
      city: 'Mataro',
      province: 'Barcelona',
      enabled: true,
      label: expect.any(String),
      description: expect.any(String),
    }));
  });

  it('POST tradueix city_exists a error localitzat', async () => {
    mockUpdateCoverageAreas.mockResolvedValueOnce({ status: 400, body: { error: 'city_exists' } });
    const res = await POST(req('POST', { action: 'add', city: 'Mataro', province: 'Barcelona' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toEqual(expect.any(String));
  });
});
