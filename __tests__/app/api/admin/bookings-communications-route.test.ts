import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockRequirePermission, mockParseBody, mockExecute } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockParseBody: vi.fn(),
  mockExecute: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth, requirePermission: mockRequirePermission }));
vi.mock('@/lib/services/bookingCommunicationService', () => ({
  parseBookingCommunicationBody: mockParseBody,
  executeBookingCommunication: mockExecute,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { POST } from '@/app/api/admin/bookings/[id]/communications/route';

function makePostReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/bookings/${id}/communications`, {
      method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('POST /api/admin/bookings/[id]/communications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockParseBody.mockReturnValue({ type: 'email', to: 'test@mail.com' });
    mockExecute.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const { req, params } = makePostReq('book-1', { type: 'email' });
    expect((await POST(req, params)).status).toBe(401);
  });

  it('rebutja sense permís mutate', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }));
    const { req, params } = makePostReq('book-1', { type: 'email' });
    expect((await POST(req, params)).status).toBe(403);
  });

  it('executa comunicació correctament', async () => {
    const { req, params } = makePostReq('book-1', { type: 'email', to: 'test@mail.com' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockExecute).toHaveBeenCalledWith('book-1', { type: 'email', to: 'test@mail.com' });
  });

  it('rebutja payload invàlid', async () => {
    mockParseBody.mockReturnValueOnce(null);
    const { req, params } = makePostReq('book-1', {});
    expect((await POST(req, params)).status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockExecute.mockRejectedValueOnce(new Error('SMTP'));
    const { req, params } = makePostReq('book-1', { type: 'email' });
    expect((await POST(req, params)).status).toBe(500);
  });
});
