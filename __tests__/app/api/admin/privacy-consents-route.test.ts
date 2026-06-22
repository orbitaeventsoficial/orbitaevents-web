import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockFindConsentById,
  mockListConsents,
  mockLogPrivacyAction,
  mockRevokeConsent,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockFindConsentById: vi.fn(),
  mockListConsents: vi.fn(),
  mockLogPrivacyAction: vi.fn(),
  mockRevokeConsent: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/privacyService', () => ({
  findConsentById: mockFindConsentById,
  listConsents: mockListConsents,
  logPrivacyAction: mockLogPrivacyAction,
  revokeConsent: mockRevokeConsent,
}));

import { DELETE, GET } from '@/app/api/admin/privacy/consents/route';

function makeDeleteReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/privacy/consents', {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/privacy/consents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListConsents.mockResolvedValue({ rows: [], total: 0 });
    mockFindConsentById.mockResolvedValue({
      id: 'consent_1',
      customerId: 'cus_1',
      email: 'ops@example.com',
      consentType: 'MARKETING',
    });
    mockLogPrivacyAction.mockResolvedValue(undefined);
    mockRevokeConsent.mockResolvedValue(undefined);
  });

  it('llista consentiments sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/privacy/consents?status=active&limit=20'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListConsents).toHaveBeenCalledWith({
      status: 'active',
      consentType: undefined,
      search: undefined,
      limit: 20,
      offset: 0,
    });
    await expect(res.json()).resolves.toEqual({ ok: true, body: { rows: [], total: 0 } });
  });

  it('rebutja auth abans de CSRF en DELETE', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await DELETE(makeDeleteReq({ consentId: 'consent_1' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockRevokeConsent).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o revocar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeDeleteReq({ consentId: 'consent_1' });

    const res = await DELETE(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockFindConsentById).not.toHaveBeenCalled();
    expect(mockRevokeConsent).not.toHaveBeenCalled();
  });

  it('retorna 400 si falta identificador de consentiment', async () => {
    const res = await DELETE(makeDeleteReq({ reason: 'manual' }));

    expect(res.status).toBe(400);
    expect(mockRevokeConsent).not.toHaveBeenCalled();
  });

  it('revoca per consentId amb CSRF valid', async () => {
    const res = await DELETE(makeDeleteReq({ consentId: 'consent_1', reason: 'manual' }));

    expect(res.status).toBe(200);
    expect(mockFindConsentById).toHaveBeenCalledWith('consent_1');
    expect(mockRevokeConsent).toHaveBeenCalledWith('cus_1', 'MARKETING');
    expect(mockLogPrivacyAction).toHaveBeenCalledWith({
      entityType: 'ConsentRecord',
      entityId: 'consent_1',
      action: 'CONSENT_REVOKED',
      performedBy: 'ADMIN',
      reason: 'manual',
      legalBasis: 'Revocació de consentiment',
    });
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it('revoca per customerId i consentType amb CSRF valid', async () => {
    const res = await DELETE(makeDeleteReq({
      customerId: 'cus_1',
      consentType: 'MARKETING',
      reason: 'manual',
    }));

    expect(res.status).toBe(200);
    expect(mockFindConsentById).not.toHaveBeenCalled();
    expect(mockRevokeConsent).toHaveBeenCalledWith('cus_1', 'MARKETING');
    expect(mockLogPrivacyAction).toHaveBeenCalledWith({
      entityType: 'Customer',
      entityId: 'cus_1',
      action: 'CONSENT_REVOKED',
      performedBy: 'ADMIN',
      reason: 'manual',
      legalBasis: 'Revocació de consentiment',
    });
  });
});
