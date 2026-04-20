import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockSync } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockSync: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/packAdminService', () => ({ syncAdminPacksFromConfig: mockSync }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { POST } from '@/app/api/admin/packs/sync/route';

describe('POST /api/admin/packs/sync', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockSync.mockResolvedValue({ ok: true, created: 2, updated: 1 }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(401);
  });

  it('sincronitza packs', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST' }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('retorna 500 si falla', async () => {
    mockSync.mockRejectedValueOnce(new Error('Config invalid'));
    expect((await POST(new NextRequest('http://localhost/x', { method: 'POST' }))).status).toBe(500);
  });
});
