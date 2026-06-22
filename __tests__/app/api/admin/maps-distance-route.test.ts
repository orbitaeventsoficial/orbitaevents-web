import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockVerifyCsrf, mockCalculateDistance } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCalculateDistance: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/googleMapsDistance', () => ({ calculateGoogleMapsDistance: mockCalculateDistance }));

import { POST } from '@/app/api/admin/maps/distance/route';

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/maps/distance', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/maps/distance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCalculateDistance.mockResolvedValue({ distanceKm: 12.4, durationText: '18 min' });
  });

  it('rebutja auth abans de permís i CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makeReq({ destination: 'Granollers' }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja permís abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await POST(makeReq({ destination: 'Granollers' }));

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o calcular', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq({ destination: 'Granollers' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCalculateDistance).not.toHaveBeenCalled();
  });

  it('retorna 400 amb body invalid', async () => {
    const res = await POST(makeReq({ destination: 'x' }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'INVALID_BODY' });
    expect(mockCalculateDistance).not.toHaveBeenCalled();
  });

  it('calcula distància amb CSRF valid', async () => {
    const res = await POST(makeReq({ destination: 'Girona', origin: 'Granollers' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, distanceKm: 12.4, durationText: '18 min' });
    expect(mockCalculateDistance).toHaveBeenCalledWith({ destination: 'Girona', origin: 'Granollers' });
  });
});
