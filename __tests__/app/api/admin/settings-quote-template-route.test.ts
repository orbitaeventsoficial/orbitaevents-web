import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockRequirePermission,
  mockVerifyCsrf,
  mockGetQuoteTemplateSettings,
  mockNormalizeQuoteTemplate,
  mockUpsertQuoteTemplateSettings,
  defaultTemplate,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetQuoteTemplateSettings: vi.fn(),
  mockNormalizeQuoteTemplate: vi.fn(),
  mockUpsertQuoteTemplateSettings: vi.fn(),
  defaultTemplate: { intro: 'Default intro', terms: 'Default terms' },
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
}));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/quoteTemplateService', () => ({
  DEFAULT_QUOTE_TEMPLATE: defaultTemplate,
  getQuoteTemplateSettings: mockGetQuoteTemplateSettings,
  normalizeQuoteTemplate: mockNormalizeQuoteTemplate,
  upsertQuoteTemplateSettings: mockUpsertQuoteTemplateSettings,
}));

import { GET, POST } from '@/app/api/admin/settings/quote-template/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/settings/quote-template', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/settings/quote-template', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockRequirePermission.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetQuoteTemplateSettings.mockResolvedValue({ intro: 'Current intro', terms: 'Current terms' });
    mockNormalizeQuoteTemplate.mockReturnValue({ intro: 'New intro', terms: 'New terms' });
    mockUpsertQuoteTemplateSettings.mockResolvedValue({ intro: 'New intro', terms: 'New terms' });
  });

  it('retorna plantilla sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/settings/quote-template'));

    expect(res.status).toBe(200);
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.any(NextRequest), 'read');
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({
      ok: true,
      template: { intro: 'Current intro', terms: 'Current terms' },
      defaults: defaultTemplate,
    });
  });

  it('rebutja auth abans de permís i CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ template: { intro: 'New intro' } }));

    expect(res.status).toBe(401);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja permís abans de CSRF en POST', async () => {
    mockRequirePermission.mockReturnValueOnce(new Response('{}', { status: 403 }));

    const res = await POST(makePostReq({ template: { intro: 'New intro' } }));

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o desar', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ template: { intro: 'New intro' } });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockNormalizeQuoteTemplate).not.toHaveBeenCalled();
    expect(mockUpsertQuoteTemplateSettings).not.toHaveBeenCalled();
  });

  it('normalitza i desa plantilla amb CSRF valid', async () => {
    const res = await POST(makePostReq({ template: { intro: 'New intro' } }));

    expect(res.status).toBe(200);
    expect(mockNormalizeQuoteTemplate).toHaveBeenCalledWith({ intro: 'New intro' });
    expect(mockUpsertQuoteTemplateSettings).toHaveBeenCalledWith({ intro: 'New intro', terms: 'New terms' });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      template: { intro: 'New intro', terms: 'New terms' },
    });
  });
});
