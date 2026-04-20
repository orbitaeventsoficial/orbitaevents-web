import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockFetchEmails, mockCountUnread, mockCountTotal, mockTestConnection } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockFetchEmails: vi.fn(),
  mockCountUnread: vi.fn(),
  mockCountTotal: vi.fn(),
  mockTestConnection: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/imap', () => ({
  fetchEmails: mockFetchEmails,
  countUnread: mockCountUnread,
  countTotal: mockCountTotal,
  testConnection: mockTestConnection,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { GET } from '@/app/api/admin/inbox/messages/route';

function makeGetReq(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/inbox/messages');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url);
}

describe('GET /api/admin/inbox/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockFetchEmails.mockResolvedValue([
      { id: '1', uid: 1, messageId: 'msg-1', from: 'a@b.com', to: 'c@d.com', subject: 'Hola', date: '2026-04-18', bodyText: 'text', bodyHtml: '<p>text</p>', isRead: false, hasAttachments: false },
    ]);
    mockCountUnread.mockResolvedValue(3);
    mockCountTotal.mockResolvedValue(10);
    mockTestConnection.mockResolvedValue({ ok: true });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await GET(makeGetReq())).status).toBe(401);
  });

  it('retorna emails per defecte (list)', async () => {
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.emails).toHaveLength(1);
    expect(body.folder).toBe('INBOX');
  });

  it('acció test connexió', async () => {
    const res = await GET(makeGetReq({ action: 'test' }));
    expect(res.status).toBe(200);
    expect(mockTestConnection).toHaveBeenCalled();
  });

  it('acció count unread', async () => {
    const res = await GET(makeGetReq({ action: 'count' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.unread).toBe(3);
  });

  it('acció countTotal', async () => {
    const res = await GET(makeGetReq({ action: 'countTotal' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(10);
  });

  it('respecta folder param', async () => {
    await GET(makeGetReq({ action: 'count', folder: 'Sent' }));
    expect(mockCountUnread).toHaveBeenCalledWith('Sent');
  });

  it('limita limit a 100', async () => {
    await GET(makeGetReq({ limit: '999' }));
    expect(mockFetchEmails).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });

  it('retorna 400 si IMAP no configurat', async () => {
    mockFetchEmails.mockRejectedValueOnce(new Error('IMAP not configured'));
    expect((await GET(makeGetReq())).status).toBe(400);
  });

  it('retorna 500 si error genèric', async () => {
    mockFetchEmails.mockRejectedValueOnce(new Error('Connection refused'));
    expect((await GET(makeGetReq())).status).toBe(500);
  });
});
