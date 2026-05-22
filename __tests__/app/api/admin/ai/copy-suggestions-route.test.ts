import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockRequireAuth, mockGenerateCopy } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockGenerateCopy: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/copyAiSuggestionsService', () => ({
  generateCopySuggestions: mockGenerateCopy,
}));

import { POST } from '@/app/api/admin/ai/copy-suggestions/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/ai/copy-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/ai/copy-suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockGenerateCopy.mockResolvedValue({
      suggestions: ['Text A', 'Text B', 'Text C'],
      generatedAt: '2026-05-20T00:00:00.000Z',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValue(new Response('Unauthorized', { status: 401 }));
    const res = await POST(makeRequest({ type: 'quote-why-us', context: 'test' }));
    expect(res.status).toBe(401);
    expect(mockGenerateCopy).not.toHaveBeenCalled();
  });

  it('retorna suggeriments per quote-why-us', async () => {
    const res = await POST(makeRequest({ type: 'quote-why-us', context: "Casament, Anna" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(3);
  });

  it('retorna suggeriments per social-caption', async () => {
    const res = await POST(makeRequest({ type: 'social-caption', context: "DJ party" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(3);
  });

  it('retorna buit per type invàlid', async () => {
    const res = await POST(makeRequest({ type: 'unknown-type', context: 'test' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(0);
    expect(mockGenerateCopy).not.toHaveBeenCalled();
  });

  it('retorna buit si context manca', async () => {
    const res = await POST(makeRequest({ type: 'quote-why-us' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(0);
    expect(mockGenerateCopy).not.toHaveBeenCalled();
  });
});
