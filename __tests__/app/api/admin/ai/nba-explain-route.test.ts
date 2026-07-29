import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockLoadNBA, mockExplain } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockLoadNBA: vi.fn(),
  mockExplain: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/nextBestActionService', () => ({ loadNextBestActions: mockLoadNBA }));
vi.mock('@/lib/services/nbaAiExplainService', () => ({ generateNBAExplanation: mockExplain }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));

import { GET } from '@/app/api/admin/ai/nba-explain/route';

const baseAction = {
  rank: 1, id: 'a1', domain: 'lead', actionType: 'CONTACT_NOW',
  urgency: 'CRITICAL', icon: '🔥', title: 'Contactar Anna',
  subtitle: 'Lead nou', href: '/admin/leads/l1', score: 140,
  entity: { type: 'lead', id: 'l1', name: 'Anna' },
  reasoning: 'SLA', estimatedImpact: 'HIGH', timeWindow: 'Ara',
};

function makeReq() {
  return new NextRequest('http://localhost/api/admin/ai/nba-explain');
}

describe('GET /api/admin/ai/nba-explain', () => {
  const prevAiEnabled = process.env.ADMIN_AI_ENABLED;

  afterEach(() => {
    if (prevAiEnabled === undefined) delete process.env.ADMIN_AI_ENABLED;
    else process.env.ADMIN_AI_ENABLED = prevAiEnabled;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_AI_ENABLED = '1';
    mockRequireAuth.mockReturnValue(null);
    mockLoadNBA.mockResolvedValue({
      actions: Array.from({ length: 3 }, (_, i) => ({ ...baseAction, id: `a${i}`, rank: i + 1 })),
    });
    mockExplain.mockResolvedValue({ explanation: 'Explicació test.', generatedAt: '2026-05-20T10:00:00Z' });
  });

  it('rebutja si no autenticat', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(mockLoadNBA).not.toHaveBeenCalled();
  });

  it('no crida serveis IA si no hi ha opt-in explícit', async () => {
    delete process.env.ADMIN_AI_ENABLED;

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      explanation: '',
      actions: [],
      generatedAt: expect.any(String),
    });
    expect(mockLoadNBA).not.toHaveBeenCalled();
    expect(mockExplain).not.toHaveBeenCalled();
  });

  it('retorna explicació i top 3 accions', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.explanation).toBe('Explicació test.');
    expect(body.actions).toHaveLength(3);
    expect(body.generatedAt).toBe('2026-05-20T10:00:00Z');
  });

  it('passa top 5 accions al servei d\'explicació', async () => {
    mockLoadNBA.mockResolvedValue({
      actions: Array.from({ length: 8 }, (_, i) => ({ ...baseAction, id: `a${i}`, rank: i + 1 })),
    });
    await GET(makeReq());
    expect(mockExplain).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'a0' })]));
    const calledWith = mockExplain.mock.calls[0][0] as unknown[];
    expect(calledWith).toHaveLength(5);
  });

  it('retorna explicació buida si servei retorna buit', async () => {
    mockExplain.mockResolvedValue({ explanation: '', generatedAt: '2026-05-20T10:00:00Z' });
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.explanation).toBe('');
    expect(res.status).toBe(200);
  });

  it('degrada a resposta buida si el motor NBA falla', async () => {
    mockLoadNBA.mockRejectedValue(new Error('nba down'));

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      explanation: '',
      actions: [],
      generatedAt: expect.any(String),
    });
  });

  it('degrada a resposta buida si el builder IA falla inesperadament', async () => {
    mockExplain.mockRejectedValue(new Error('ai down'));

    const res = await GET(makeReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      explanation: '',
      actions: [],
      generatedAt: expect.any(String),
    });
  });
});
