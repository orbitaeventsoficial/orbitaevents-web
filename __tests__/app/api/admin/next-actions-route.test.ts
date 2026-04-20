import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockLoadNBA } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockLoadNBA: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/services/nextBestActionService', () => ({
  loadNextBestActions: mockLoadNBA,
}));

import { GET } from '@/app/api/admin/next-actions/route';

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/next-actions');
}

describe('GET /api/admin/next-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockLoadNBA.mockResolvedValue({
      generatedAt: '2026-06-15T10:00:00Z',
      totalActions: 2,
      byCritical: 1,
      byHigh: 1,
      byMedium: 0,
      byLow: 0,
      actions: [
        { rank: 1, id: 'a1', domain: 'lead', actionType: 'CONTACT_NOW', urgency: 'CRITICAL', icon: '🔥', title: 'Contactar Anna', subtitle: 'Lead nou', href: '/admin/leads/l1', score: 140, entity: { type: 'lead', id: 'l1', name: 'Anna' }, reasoning: 'SLA', estimatedImpact: 'HIGH', timeWindow: 'Ara' },
        { rank: 2, id: 'a2', domain: 'task', actionType: 'COMPLETE_TASK', urgency: 'HIGH', icon: '🚨', title: 'Tasca vençuda', subtitle: 'Vençuda fa 2 dies', href: '/admin/tasks', score: 100, entity: { type: 'task', id: 't1', name: 'Tasca' }, reasoning: 'Vençuda', estimatedImpact: 'MEDIUM', timeWindow: 'Avui' },
      ],
    });
  });

  it('rebutja si requireAuth retorna error', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect(mockLoadNBA).not.toHaveBeenCalled();
  });

  it('retorna JSON amb report NBA', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalActions).toBe(2);
    expect(body.byCritical).toBe(1);
    expect(body.actions).toHaveLength(2);
  });

  it('crida loadNextBestActions', async () => {
    await GET(makeRequest());
    expect(mockLoadNBA).toHaveBeenCalledTimes(1);
  });

  it('retorna accions amb estructura correcta', async () => {
    const res = await GET(makeRequest());
    const body = await res.json();
    const action = body.actions[0];
    expect(action.rank).toBe(1);
    expect(action.domain).toBe('lead');
    expect(action.urgency).toBe('CRITICAL');
    expect(action.href).toContain('/admin/');
    expect(action.entity.type).toBe('lead');
    expect(action.reasoning).toBeTruthy();
  });
});
