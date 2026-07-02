import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGenerateContent } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGenerateContent: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(function GoogleGenerativeAI() {
    return {
      getGenerativeModel: vi.fn(() => ({
        generateContent: mockGenerateContent,
      })),
    };
  }),
}));

function makeRequest(text: string) {
  return new NextRequest('http://localhost/api/admin/leads/extract', {
    method: 'POST',
    body: JSON.stringify({ text }),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = 'test-key';
  mockRequireAuth.mockReturnValue(null);
  mockVerifyCsrf.mockReturnValue(null);
});

describe('POST /api/admin/leads/extract', () => {
  it('resol textos curts amb dades suficients en local sense consumir Gemini', async () => {
    const { POST } = await import('@/app/api/admin/leads/extract/route');

    const res = await POST(makeRequest('Hola soc Maria. Tel 600123123. Boda 20/09/2026 a Girona.'));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.data).toEqual(expect.objectContaining({
      name: 'Maria',
      phone: '600123123',
      eventType: 'WEDDING',
      eventDate: '2026-09-20',
      eventLocation: 'Girona',
    }));
    expect(payload.fallback).toBeUndefined();
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it('posa cooldown quan Gemini retorna quota i el seguent text curt no torna a cridar IA', async () => {
    const { POST } = await import('@/app/api/admin/leads/extract/route');
    mockGenerateContent.mockRejectedValueOnce(new Error('429 resource_exhausted quota'));

    const first = await POST(makeRequest('Aquest text no te dades suficients per al parser local i hauria de provar IA perque supera clarament el minim de llargada establert.'));
    const firstPayload = await first.json();
    const second = await POST(makeRequest('Aquest altre text tampoc te dades suficients per al parser local pero supera tambe clarament el minim de llargada establert.'));
    const secondPayload = await second.json();

    expect(first.status).toBe(200);
    expect(firstPayload.fallbackReason).toBe('quota');
    expect(second.status).toBe(200);
    expect(secondPayload.fallbackReason).toBe('quota');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('no consumeix Gemini quan el text es massa curt i no aporta dades', async () => {
    const { POST } = await import('@/app/api/admin/leads/extract/route');

    const res = await POST(makeRequest('hola'));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.fallbackReason).toBe('too-short');
    expect(payload.data.eventType).toBe('OTHER');
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});
