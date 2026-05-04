import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockSendBulkComposeSegment } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockSendBulkComposeSegment: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/services/bulkComposeSegmentService', () => ({
  sendBulkComposeSegment: mockSendBulkComposeSegment,
}));

import { POST } from '@/app/api/admin/emails/send-bulk/route';

describe('POST /api/admin/emails/send-bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockSendBulkComposeSegment.mockResolvedValue({
      ok: true,
      segmentKey: 'customers-weddings-2025',
      audienceSize: 10,
      sent: 9,
      failed: 1,
    });
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const req = new NextRequest('http://localhost/api/admin/emails/send-bulk', { method: 'POST' });
    expect((await POST(req)).status).toBe(401);
  });

  it('executa l’enviament bulk i retorna summary', async () => {
    const req = new NextRequest('http://localhost/api/admin/emails/send-bulk', {
      method: 'POST',
      body: JSON.stringify({
        segmentKey: 'customers-weddings-2025',
        subject: 'Hola',
        body: 'Body',
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockSendBulkComposeSegment).toHaveBeenCalledWith({
      segmentKey: 'customers-weddings-2025',
      subject: 'Hola',
      body: 'Body',
      templateKey: null,
    });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      summary: expect.objectContaining({ audienceSize: 10, sent: 9 }),
    });
  });

  it('propaga error funcional', async () => {
    mockSendBulkComposeSegment.mockResolvedValueOnce({
      ok: false,
      status: 404,
      error: 'Segment no trobat',
    });
    const req = new NextRequest('http://localhost/api/admin/emails/send-bulk', {
      method: 'POST',
      body: JSON.stringify({
        segmentKey: 'missing',
        subject: 'Hola',
        body: 'Body',
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'Segment no trobat',
    });
  });
});
