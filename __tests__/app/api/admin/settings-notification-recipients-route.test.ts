import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockListNotificationRecipients,
  mockSaveNotificationRecipients,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListNotificationRecipients: vi.fn(),
  mockSaveNotificationRecipients: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/notificationRecipientsService', () => ({
  NOTIFICATION_CATEGORIES: ['booking', 'lead'],
  listNotificationRecipients: mockListNotificationRecipients,
  saveNotificationRecipients: mockSaveNotificationRecipients,
}));

import { GET, POST } from '@/app/api/admin/settings/notification-recipients/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/settings/notification-recipients', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/settings/notification-recipients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListNotificationRecipients.mockResolvedValue([{ email: 'ops@example.com', categories: ['booking'] }]);
    mockSaveNotificationRecipients.mockResolvedValue([{ email: 'ops@example.com', categories: ['booking'] }]);
  });

  it('retorna destinataris sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/settings/notification-recipients'));

    expect(res.status).toBe(200);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      ok: true,
      recipients: [{ email: 'ops@example.com', categories: ['booking'] }],
      categories: ['booking', 'lead'],
    });
  });

  it('rebutja auth abans de permís i CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ recipients: [] }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja permís abans de CSRF en POST', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await POST(makePostReq({ recipients: [] }));

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o desar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ recipients: [{ email: 'ops@example.com' }] });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockSaveNotificationRecipients).not.toHaveBeenCalled();
  });

  it('desa destinataris amb CSRF valid', async () => {
    const recipients = [{ email: 'ops@example.com', categories: ['booking'] }];

    const res = await POST(makePostReq({ recipients }));

    expect(res.status).toBe(200);
    expect(mockSaveNotificationRecipients).toHaveBeenCalledWith(recipients);
    await expect(res.json()).resolves.toEqual({ ok: true, recipients });
  });
});
