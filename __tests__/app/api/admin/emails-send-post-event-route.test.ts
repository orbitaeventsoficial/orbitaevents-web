import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockSendPostEvent } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockSendPostEvent: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/postEventDispatchService', () => ({ sendPostEventEmailForBooking: mockSendPostEvent }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn() } }));

import { POST } from '@/app/api/admin/emails/send-post-event/route';

function makeReq(bookingId?: string) {
  const form = new FormData();
  if (bookingId) form.append('bookingId', bookingId);
  return new NextRequest('http://localhost/api/admin/emails/send-post-event', { method: 'POST', body: form });
}

describe('POST /api/admin/emails/send-post-event', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockSendPostEvent.mockResolvedValue({ status: 'sent', email: 'a@b.cat', reference: 'ref-1' }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await POST(makeReq('b1'))).status).toBe(401);
  });

  it('rebutja sense bookingId', async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain('bookingId');
  });

  it('envia email post-event correctament', async () => {
    const res = await POST(makeReq('b1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.email).toBe('a@b.cat');
    expect(mockSendPostEvent).toHaveBeenCalledWith('b1', { createAdminLog: true });
  });

  it('retorna 404 si reserva no trobada', async () => {
    mockSendPostEvent.mockResolvedValueOnce({ status: 'error', reason: 'Reserva no trobada' });
    const res = await POST(makeReq('xxx'));
    expect(res.status).toBe(404);
  });

  it('retorna 422 si reserva no completada', async () => {
    mockSendPostEvent.mockResolvedValueOnce({ status: 'skipped', reason: 'La reserva no està completada' });
    const res = await POST(makeReq('b1'));
    expect(res.status).toBe(422);
  });

  it('retorna 409 si ja enviat', async () => {
    mockSendPostEvent.mockResolvedValueOnce({ status: 'skipped', reason: "Ja s'ha enviat l'email" });
    const res = await POST(makeReq('b1'));
    expect(res.status).toBe(409);
  });

  it('retorna 500 si error genèric', async () => {
    mockSendPostEvent.mockRejectedValueOnce(new Error('SMTP'));
    const res = await POST(makeReq('b1'));
    expect(res.status).toBe(500);
  });
});
