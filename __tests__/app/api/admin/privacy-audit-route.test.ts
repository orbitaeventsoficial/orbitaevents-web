import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockPrisma } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockPrisma: {
    privacyAuditLog: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { GET } from '@/app/api/admin/privacy/audit/route';

describe('GET /api/admin/privacy/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockPrisma.privacyAuditLog.findMany.mockResolvedValue([{ id: 'al1' }]);
    mockPrisma.privacyAuditLog.count.mockResolvedValue(1);
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    expect((await GET(new NextRequest('http://localhost/api/admin/privacy/audit'))).status).toBe(401);
  });

  it('retorna logs d\'auditoria', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/privacy/audit'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.body.logs).toHaveLength(1);
    expect(body.body.total).toBe(1);
  });

  it('filtra per acció', async () => {
    await GET(new NextRequest('http://localhost/api/admin/privacy/audit?action=CONSENT_REVOKED'));
    expect(mockPrisma.privacyAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { action: 'CONSENT_REVOKED' } }));
  });

  it('retorna 500 si falla', async () => {
    mockPrisma.privacyAuditLog.findMany.mockRejectedValueOnce(new Error('DB'));
    expect((await GET(new NextRequest('http://localhost/api/admin/privacy/audit'))).status).toBe(500);
  });
});
