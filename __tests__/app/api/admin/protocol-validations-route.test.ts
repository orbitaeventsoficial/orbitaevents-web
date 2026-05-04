import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockGetAdminRole,
  mockLoadCanviValidations,
  mockRecordCanviValidation,
  mockRemoveCanviValidation,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockGetAdminRole: vi.fn(),
  mockLoadCanviValidations: vi.fn(),
  mockRecordCanviValidation: vi.fn(),
  mockRemoveCanviValidation: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
  getAdminRole: mockGetAdminRole,
}));

vi.mock('@/lib/services/protocolValidationsService', () => ({
  loadCanviValidations: mockLoadCanviValidations,
  recordCanviValidation: mockRecordCanviValidation,
  removeCanviValidation: mockRemoveCanviValidation,
}));

import { DELETE, GET, POST } from '@/app/api/admin/protocol/validations/route';

describe('/api/admin/protocol/validations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockGetAdminRole.mockReturnValue('OWNER');
    mockLoadCanviValidations.mockResolvedValue(
      new Map([
        [462, { canviN: 462, validatedAt: '2026-04-30T10:00:00.000Z', validatedBy: 'OWNER' }],
      ]),
    );
    mockRecordCanviValidation.mockResolvedValue({
      canviN: 465,
      validatedAt: '2026-05-01T09:00:00.000Z',
      validatedBy: 'OWNER',
      notes: 'OK',
    });
    mockRemoveCanviValidation.mockResolvedValue(true);
  });

  it('GET rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const req = new NextRequest('http://localhost/api/admin/protocol/validations');
    expect((await GET(req)).status).toBe(401);
  });

  it('GET retorna les validacions com array', async () => {
    const req = new NextRequest('http://localhost/api/admin/protocol/validations');
    const res = await GET(req);

    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'read');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      validations: [{ canviN: 462, validatedAt: '2026-04-30T10:00:00.000Z', validatedBy: 'OWNER' }],
    });
  });

  it('POST rebutja sense permission mutate', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/protocol/validations', {
      method: 'POST',
      body: JSON.stringify({ canviN: 465 }),
    });
    expect((await POST(req)).status).toBe(403);
  });

  it('POST valida el body i retorna 400 si es invalid', async () => {
    const req = new NextRequest('http://localhost/api/admin/protocol/validations', {
      method: 'POST',
      body: JSON.stringify({ canviN: 0 }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockRecordCanviValidation).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: 'invalid-body' });
  });

  it('POST registra la validacio amb el rol admin canonic', async () => {
    mockGetAdminRole.mockReturnValueOnce('MANAGER');
    const req = new NextRequest('http://localhost/api/admin/protocol/validations', {
      method: 'POST',
      body: JSON.stringify({ canviN: 465, notes: '  OK  ' }),
    });

    const res = await POST(req);

    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockRecordCanviValidation).toHaveBeenCalledWith({
      canviN: 465,
      validatedBy: 'MANAGER',
      notes: 'OK',
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      validation: expect.objectContaining({ canviN: 465, validatedBy: 'OWNER', notes: 'OK' }),
    });
  });

  it('DELETE valida el body i elimina la validacio', async () => {
    const req = new NextRequest('http://localhost/api/admin/protocol/validations', {
      method: 'DELETE',
      body: JSON.stringify({ canviN: 465 }),
    });

    const res = await DELETE(req);

    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockRemoveCanviValidation).toHaveBeenCalledWith(465);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, removed: true });
  });

  it('DELETE retorna 400 amb body invalid', async () => {
    const req = new NextRequest('http://localhost/api/admin/protocol/validations', {
      method: 'DELETE',
      body: JSON.stringify({ canviN: -1 }),
    });

    const res = await DELETE(req);

    expect(res.status).toBe(400);
    expect(mockRemoveCanviValidation).not.toHaveBeenCalled();
  });
});
