import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockGetTextManagerPayload,
  mockRunTextManagerAction,
  mockSaveTextManagerModifications,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetTextManagerPayload: vi.fn(),
  mockRunTextManagerAction: vi.fn(),
  mockSaveTextManagerModifications: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/textManagerService', () => ({
  getTextManagerPayload: mockGetTextManagerPayload,
  runTextManagerAction: mockRunTextManagerAction,
  saveTextManagerModifications: mockSaveTextManagerModifications,
}));

import { GET, POST, PUT } from '@/app/api/admin/text-manager/route';

function makeReq(method: 'POST' | 'PUT', body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/text-manager', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/text-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetTextManagerPayload.mockResolvedValue({ ok: true, namespaces: ['common'] });
    mockRunTextManagerAction.mockResolvedValue({ ok: true, action: 'sync' });
    mockSaveTextManagerModifications.mockResolvedValue({
      status: 200,
      body: { ok: true, saved: 1 },
    });
  });

  it('retorna payload sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/text-manager'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetTextManagerPayload).toHaveBeenCalledTimes(1);
    await expect(res.json()).resolves.toEqual({ ok: true, namespaces: ['common'] });
  });

  it('rebutja auth abans de permís i CSRF en PUT', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await PUT(makeReq('PUT', { modifications: {} }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja permís abans de CSRF en PUT', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await PUT(makeReq('PUT', { modifications: {} }));

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o desar en PUT', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('PUT', { modifications: { key: 'value' }, locale: 'ca' });

    const res = await PUT(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockSaveTextManagerModifications).not.toHaveBeenCalled();
  });

  it('desa modificacions amb CSRF valid', async () => {
    const payload = { modifications: { key: 'value' }, locale: 'ca' };

    const res = await PUT(makeReq('PUT', payload));

    expect(res.status).toBe(200);
    expect(mockSaveTextManagerModifications).toHaveBeenCalledWith(payload);
    await expect(res.json()).resolves.toEqual({ ok: true, saved: 1 });
  });

  it('rebutja CSRF abans de llegir body o executar acció en POST', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq('POST', { action: 'sync' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockRunTextManagerAction).not.toHaveBeenCalled();
  });

  it('executa acció amb CSRF valid', async () => {
    const res = await POST(makeReq('POST', { action: 'sync' }));

    expect(res.status).toBe(200);
    expect(mockRunTextManagerAction).toHaveBeenCalledWith('sync');
    await expect(res.json()).resolves.toEqual({ ok: true, action: 'sync' });
  });
});
