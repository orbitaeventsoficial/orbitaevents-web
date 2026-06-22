import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockCheckRateLimit,
  mockDetectAdminContentLanguage,
  mockTranslateAdminContent,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockDetectAdminContentLanguage: vi.fn(),
  mockTranslateAdminContent: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/translationService', () => ({
  detectAdminContentLanguage: mockDetectAdminContentLanguage,
  translateAdminContent: mockTranslateAdminContent,
}));

import { GET, POST } from '@/app/api/admin/translate/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/translate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/translate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockCheckRateLimit.mockResolvedValue(null);
    mockDetectAdminContentLanguage.mockReturnValue({ ok: true, text: 'Hola', detectedLanguage: 'ca' });
    mockTranslateAdminContent.mockResolvedValue({
      ok: true,
      original: 'Hola',
      translations: { es: 'Hola', en: 'Hello' },
      translationsByText: { Hola: { es: 'Hola', en: 'Hello' } },
    });
  });

  it('detecta idioma sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/translate?text=Hola'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCheckRateLimit).toHaveBeenCalledWith(expect.any(NextRequest), {
      limit: 60,
      windowSeconds: 300,
      prefix: 'admin-translate-detect',
    });
    expect(mockDetectAdminContentLanguage).toHaveBeenCalledWith('Hola');
    await expect(res.json()).resolves.toEqual({ ok: true, text: 'Hola', detectedLanguage: 'ca' });
  });

  it('rebutja auth abans de CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ text: 'Hola' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockTranslateAdminContent).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de rate limit, body o traducció', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ text: 'Hola' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockTranslateAdminContent).not.toHaveBeenCalled();
  });

  it('aplica rate limit després de CSRF i abans de traduir', async () => {
    mockCheckRateLimit.mockResolvedValueOnce(new Response('{}', { status: 429 }));

    const res = await POST(makePostReq({ text: 'Hola' }));

    expect(res.status).toBe(429);
    expect(mockTranslateAdminContent).not.toHaveBeenCalled();
  });

  it('tradueix amb CSRF valid', async () => {
    const res = await POST(makePostReq({ text: 'Hola', targetLanguages: ['en'] }));

    expect(res.status).toBe(200);
    expect(mockCheckRateLimit).toHaveBeenCalledWith(expect.any(NextRequest), {
      limit: 30,
      windowSeconds: 300,
      prefix: 'admin-translate',
    });
    expect(mockTranslateAdminContent).toHaveBeenCalledWith({ text: 'Hola', targetLanguages: ['en'] });
    await expect(res.json()).resolves.toEqual({
      ok: true,
      original: 'Hola',
      translations: { es: 'Hola', en: 'Hello' },
      translationsByText: { Hola: { es: 'Hola', en: 'Hello' } },
    });
  });
});
