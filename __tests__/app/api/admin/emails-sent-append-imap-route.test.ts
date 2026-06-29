import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockRetryAppendToSent } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRetryAppendToSent: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/emailSentRetryService', () => ({
  retryAppendToSent: mockRetryAppendToSent,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));

import { POST } from '@/app/api/admin/emails/sent/[id]/append-imap/route';

function makeRequest(id = 'email-send-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/emails/sent/${id}/append-imap`, { method: 'POST' }),
    params: { params: Promise.resolve({ id }) },
  };
}

describe('POST /api/admin/emails/sent/[id]/append-imap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockRetryAppendToSent.mockResolvedValue({ kind: 'ok', folder: 'INBOX.Sent', uid: 42 });
  });

  it('exigeix sessio admin abans del reintent APPEND', async () => {
    mockRequireAuth.mockReturnValueOnce(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const { req, params } = makeRequest();

    const res = await POST(req, params);

    expect(res.status).toBe(401);
    expect(mockRetryAppendToSent).not.toHaveBeenCalled();
  });

  it('exigeix CSRF abans del reintent APPEND', async () => {
    mockVerifyCsrf.mockResolvedValueOnce(NextResponse.json({ error: 'CSRF' }, { status: 403 }));
    const { req, params } = makeRequest();

    const res = await POST(req, params);

    expect(res.status).toBe(403);
    expect(mockRetryAppendToSent).not.toHaveBeenCalled();
  });

  it('tradueix el reintent correcte a resposta HTTP observable', async () => {
    const { req, params } = makeRequest('email-send-1');

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ ok: true, folder: 'INBOX.Sent', uid: 42 });
    expect(mockRetryAppendToSent).toHaveBeenCalledWith('email-send-1');
  });

  it('retorna 404 quan EmailSend no existeix', async () => {
    mockRetryAppendToSent.mockResolvedValueOnce({ kind: 'not-found' });
    const { req, params } = makeRequest('missing');

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: 'EmailSend no trobat' });
  });

  it('retorna 400 quan falta snapshot per reconstruir MIME', async () => {
    mockRetryAppendToSent.mockResolvedValueOnce({ kind: 'no-snapshot' });
    const { req, params } = makeRequest();

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: 'No tenim snapshot HTML per reconstruir el MIME' });
  });

  it('retorna 500 quan APPEND falla al servidor IMAP', async () => {
    mockRetryAppendToSent.mockResolvedValueOnce({ kind: 'append-failed', error: 'Mailbox unavailable' });
    const { req, params } = makeRequest();

    const res = await POST(req, params);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ ok: false, error: 'Mailbox unavailable' });
  });
});
