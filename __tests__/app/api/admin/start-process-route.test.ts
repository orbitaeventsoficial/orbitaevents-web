import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockStartCustomerProcess } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockStartCustomerProcess: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/customerProcessService', () => ({
  startCustomerProcess: mockStartCustomerProcess,
}));

import { POST } from '@/app/api/admin/start-process/route';

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/start-process', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/start-process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockStartCustomerProcess.mockResolvedValue({
      status: 200,
      body: { success: true, processType: 'welcome' },
    });
  });

  it('rebutja auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makeReq({ customerId: 'cus_1', processType: 'welcome' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockStartCustomerProcess).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o iniciar procés', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeReq({ customerId: 'cus_1', processType: 'welcome' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockStartCustomerProcess).not.toHaveBeenCalled();
  });

  it('retorna el resultat del servei amb CSRF valid', async () => {
    mockStartCustomerProcess.mockResolvedValueOnce({
      status: 202,
      body: { success: true, processType: 'review_request' },
    });

    const res = await POST(makeReq({ customerId: 'cus_1', processType: 'review_request' }));

    expect(res.status).toBe(202);
    expect(mockStartCustomerProcess).toHaveBeenCalledWith({
      customerId: 'cus_1',
      processType: 'review_request',
    });
    await expect(res.json()).resolves.toEqual({ success: true, processType: 'review_request' });
  });

  it('retorna 500 si el servei falla', async () => {
    mockStartCustomerProcess.mockRejectedValueOnce(new Error('boom'));

    const res = await POST(makeReq({ customerId: 'cus_1', processType: 'welcome' }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Error iniciant procés' });
  });
});
