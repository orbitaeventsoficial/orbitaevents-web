import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockReadCronRunStatuses,
  mockLogError,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockReadCronRunStatuses: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/logger', () => ({ log: { error: mockLogError } }));
vi.mock('@/lib/services/cronRunStatusService', () => ({
  readCronRunStatuses: mockReadCronRunStatuses,
}));

import { GET } from '@/app/api/admin/crons/route';
import { ADMIN_CRON_PREFIXES } from '@/lib/constants/admin';

describe('/api/admin/crons route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockReadCronRunStatuses.mockResolvedValue([
      {
        ...ADMIN_CRON_PREFIXES[0],
        lastRun: '2026-07-09T00:00:00.000Z',
        lastStatus: 'ok',
        lastSummary: null,
        lastMessage: null,
        health: 'ok',
      },
    ]);
  });

  it('retorna els crons monitoritzats', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/crons'));

    expect(res.status).toBe(200);
    expect(mockReadCronRunStatuses).toHaveBeenCalledWith([...ADMIN_CRON_PREFIXES]);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      crons: [
        expect.objectContaining({
          id: ADMIN_CRON_PREFIXES[0].id,
          prefix: ADMIN_CRON_PREFIXES[0].prefix,
          health: 'ok',
        }),
      ],
    });
  });

  it('rebutja auth abans de llegir Settings', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('Unauthorized', { status: 401 }));

    const res = await GET(new NextRequest('http://localhost/api/admin/crons'));

    expect(res.status).toBe(401);
    expect(mockReadCronRunStatuses).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla la lectura de crons', async () => {
    mockReadCronRunStatuses.mockRejectedValueOnce(new Error('DB'));

    const res = await GET(new NextRequest('http://localhost/api/admin/crons'));

    expect(res.status).toBe(500);
    expect(mockLogError).toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'Error obtenint estat dels crons',
    });
  });
});
