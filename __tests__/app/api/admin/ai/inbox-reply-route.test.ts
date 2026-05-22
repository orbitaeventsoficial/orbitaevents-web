import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockRequireAuth, mockGenerateSuggestions } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGenerateSuggestions: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/inboxAiReplyService', () => ({
  generateInboxReplySuggestions: mockGenerateSuggestions,
}));

import { POST } from '@/app/api/admin/ai/inbox-reply/route';

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/admin/ai/inbox-reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/ai/inbox-reply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockGenerateSuggestions.mockResolvedValue({
      suggestions: ['Hola Anna, gràcies!', 'T\'enviem info aviat.', 'Quan et va bé parlem?'],
      generatedAt: '2026-05-20T00:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValue(new Response('Unauthorized', { status: 401 }));
    const res = await POST(makeRequest({ bodyText: 'hola' }));
    expect(res.status).toBe(401);
    expect(mockGenerateSuggestions).not.toHaveBeenCalled();
  });

  it('retorna suggeriments correctes', async () => {
    const res = await POST(makeRequest({ fromName: 'Anna', subject: 'Test', bodyText: 'Hola, necessito info.' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(3);
    expect(data.generatedAt).toBeTruthy();
  });

  it('retorna buit si bodyText manca', async () => {
    const res = await POST(makeRequest({ fromName: 'Anna', subject: 'Test' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(0);
    expect(mockGenerateSuggestions).not.toHaveBeenCalled();
  });

  it('passa eventType al servei', async () => {
    await POST(makeRequest({ fromName: 'A', subject: 'S', bodyText: 'Text', eventType: 'wedding' }));
    expect(mockGenerateSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'wedding' }),
    );
  });
});
