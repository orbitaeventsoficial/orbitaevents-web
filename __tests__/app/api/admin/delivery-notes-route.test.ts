import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockGetRequestId,
  mockCreateDeliveryNote,
  mockUpdateDeliveryNote,
  mockGenerateDeliveryNotePdf,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetRequestId: vi.fn(),
  mockCreateDeliveryNote: vi.fn(),
  mockUpdateDeliveryNote: vi.fn(),
  mockGenerateDeliveryNotePdf: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/request-context', () => ({ getRequestId: mockGetRequestId }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/deliveryNoteAdminService', () => ({
  listAdminDeliveryNotes: vi.fn(),
  getAdminDeliveryNoteById: vi.fn(),
  createAdminDeliveryNoteFromBooking: mockCreateDeliveryNote,
  updateAdminDeliveryNoteStatus: mockUpdateDeliveryNote,
  generateAdminDeliveryNotePdf: mockGenerateDeliveryNotePdf,
}));

import { POST } from '@/app/api/admin/delivery-notes/route';
import { PATCH } from '@/app/api/admin/delivery-notes/[id]/route';
import { POST as POST_PDF } from '@/app/api/admin/delivery-notes/[id]/pdf/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/delivery-notes', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makePatchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/delivery-notes/dn-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'user-agent': 'vitest' },
  });
}

function makePdfReq() {
  return new NextRequest('http://localhost/api/admin/delivery-notes/dn-1/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/delivery-notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetRequestId.mockReturnValue('req-1');
    mockCreateDeliveryNote.mockResolvedValue({ ok: true, deliveryNoteId: 'dn-1', reference: 'ALB-2026-0001' });
    mockUpdateDeliveryNote.mockResolvedValue({ status: 200, body: { ok: true } });
    mockGenerateDeliveryNotePdf.mockResolvedValue({ status: 200, body: { ok: true, pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB.pdf' } });
  });

  it('rebutja sense permís mutate abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const req = makePostReq({ bookingId: 'booking-1' });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateDeliveryNote).not.toHaveBeenCalled();
  });

  it('crea albarà de reserva amb CSRF vàlid', async () => {
    const res = await POST(makePostReq({ bookingId: 'booking-1' }));

    expect(res.status).toBe(200);
    expect(mockCreateDeliveryNote).toHaveBeenCalledWith('booking-1');
    await expect(res.json()).resolves.toMatchObject({ ok: true, reference: 'ALB-2026-0001' });
  });
});

describe('PATCH /api/admin/delivery-notes/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetRequestId.mockReturnValue('req-1');
    mockUpdateDeliveryNote.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('valida estat abans de mutar', async () => {
    const res = await PATCH(makePatchReq({ status: 'PAID' }), { params: { id: 'dn-1' } });

    expect(res.status).toBe(400);
    expect(mockUpdateDeliveryNote).not.toHaveBeenCalled();
  });

  it('marca albarà com signat amb traça de request', async () => {
    const req = makePatchReq({ status: 'SIGNED' });
    const res = await PATCH(req, { params: { id: 'dn-1' } });

    expect(res.status).toBe(200);
    expect(mockUpdateDeliveryNote).toHaveBeenCalledWith('dn-1', 'SIGNED', expect.objectContaining({
      signatureUa: 'vitest',
    }));
  });
});

describe('POST /api/admin/delivery-notes/[id]/pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetRequestId.mockReturnValue('req-1');
    mockGenerateDeliveryNotePdf.mockResolvedValue({ status: 200, body: { ok: true, pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB.pdf' } });
  });

  it('rebutja sense permís mutate abans de CSRF', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePdfReq();

    const res = await POST_PDF(req, { params: { id: 'dn-1' } });

    expect(res.status).toBe(403);
    expect(mockRequirePermission).toHaveBeenCalledWith(req, 'mutate');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGenerateDeliveryNotePdf).not.toHaveBeenCalled();
  });

  it('genera i persisteix PDF d’albarà amb CSRF vàlid', async () => {
    const res = await POST_PDF(makePdfReq(), { params: { id: 'dn-1' } });

    expect(res.status).toBe(200);
    expect(mockGenerateDeliveryNotePdf).toHaveBeenCalledWith('dn-1');
    await expect(res.json()).resolves.toMatchObject({ ok: true, pdfUrl: '/api/uploads/delivery-notes/dn-1/ALB.pdf' });
  });
});
