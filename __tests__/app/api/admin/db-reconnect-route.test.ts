import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockDisconnect,
  mockConnect,
  mockQueryRaw,
  mockAdminLogCreate,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockDisconnect: vi.fn(),
  mockConnect: vi.fn(),
  mockQueryRaw: vi.fn(),
  mockAdminLogCreate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $disconnect: mockDisconnect,
    $connect: mockConnect,
    $queryRaw: mockQueryRaw,
    adminLog: { create: mockAdminLogCreate },
  },
}));

import { POST } from '@/app/api/admin/system/db-reconnect/route';

function makeReq() {
  return new NextRequest('http://localhost/api/admin/system/db-reconnect', { method: 'POST' });
}

describe('POST /api/admin/system/db-reconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockDisconnect.mockResolvedValue(undefined);
    mockConnect.mockResolvedValue(undefined);
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockAdminLogCreate.mockResolvedValue({ id: 'log-1' });
  });

  it('rebutja auth abans de permís i CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makeReq());

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja permís abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await POST(makeReq());

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de reconnectar Prisma', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq();

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('reconnecta la base de dades amb CSRF valid', async () => {
    const res = await POST(makeReq());

    expect(res.status).toBe(200);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
    expect(mockAdminLogCreate).toHaveBeenCalledWith({
      data: {
        action: 'UPDATE',
        entity: 'system',
        entityId: 'database.connection',
        details: { action: 'db_reconnect' },
      },
    });
    await expect(res.json()).resolves.toMatchObject({ ok: true });
  });
});
