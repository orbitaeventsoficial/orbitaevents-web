import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockRecordDecision } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRecordDecision: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/services/postEventRecurrenceDecisionService', () => ({
  recordPostEventRecurrenceDecision: mockRecordDecision,
}));

import { POST } from '@/app/api/admin/post-event/recurrence-decision/route';

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/post-event/recurrence-decision', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const VALID_BODY = {
  customerId: 'cust-1',
  bookingId: 'book-1',
  actionKey: 'referral_ask',
  draft: 'Hola Anna',
  href: '/admin/clientes/referrals',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockReturnValue(null);
  mockVerifyCsrf.mockReturnValue(null);
  mockRecordDecision.mockResolvedValue({ status: 201, body: { ok: true } });
});

describe('POST /api/admin/post-event/recurrence-decision', () => {
  it('rebutja sense autenticacio', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    );

    const res = await POST(makeReq(VALID_BODY));

    expect(res.status).toBe(401);
    expect(mockRecordDecision).not.toHaveBeenCalled();
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'CSRF token missing' }), { status: 403 })
    );

    const res = await POST(makeReq(VALID_BODY));

    expect(res.status).toBe(403);
    expect(mockRecordDecision).not.toHaveBeenCalled();
  });

  it('valida el payload abans de cridar el servei', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, actionKey: 'thank_you' }));

    expect(res.status).toBe(400);
    expect(mockRecordDecision).not.toHaveBeenCalled();
  });

  it('registra la decisio amb el servei servidor', async () => {
    const res = await POST(makeReq(VALID_BODY));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockRecordDecision).toHaveBeenCalledWith(VALID_BODY);
  });
});
