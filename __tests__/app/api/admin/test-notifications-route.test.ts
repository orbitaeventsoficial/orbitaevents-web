import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockGetAdminNotificationDiagnostics,
  mockSendAdminTestEmail,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetAdminNotificationDiagnostics: vi.fn(),
  mockSendAdminTestEmail: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/adminTestNotificationService', () => ({
  getAdminNotificationDiagnostics: mockGetAdminNotificationDiagnostics,
  sendAdminTestEmail: mockSendAdminTestEmail,
}));

import { GET, POST } from '@/app/api/admin/test-notifications/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/test-notifications', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/test-notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetAdminNotificationDiagnostics.mockResolvedValue({ success: true, configured: true });
    mockSendAdminTestEmail.mockResolvedValue({
      status: 200,
      body: { success: true, email: 'ops@example.com' },
    });
  });

  it('retorna diagnòstic sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/test-notifications'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetAdminNotificationDiagnostics).toHaveBeenCalledTimes(1);
    await expect(res.json()).resolves.toEqual({ success: true, configured: true });
  });

  it('rebutja auth abans de CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ email: 'ops@example.com' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockSendAdminTestEmail).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o enviar email de test', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ email: 'ops@example.com' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockSendAdminTestEmail).not.toHaveBeenCalled();
  });

  it('envia email de test amb CSRF valid', async () => {
    const res = await POST(makePostReq({ email: 'ops@example.com' }));

    expect(res.status).toBe(200);
    expect(mockSendAdminTestEmail).toHaveBeenCalledWith('ops@example.com');
    await expect(res.json()).resolves.toEqual({ success: true, email: 'ops@example.com' });
  });

  it('retorna 500 si el servei falla', async () => {
    mockSendAdminTestEmail.mockRejectedValueOnce(new Error('SMTP down'));

    const res = await POST(makePostReq({ email: 'ops@example.com' }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: 'SMTP down',
    });
  });
});
