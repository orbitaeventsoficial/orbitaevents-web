import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockFetchCustomerHub } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockFetchCustomerHub: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/customer-hub/fetchCustomerHub', () => ({
  fetchCustomerHub: mockFetchCustomerHub,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/request-context', () => ({
  getRequestId: () => 'test-req-id',
}));

import { GET } from '@/app/api/admin/customers/[id]/hub/route';

function makeRequest(id = 'cust-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/customers/${id}/hub`),
    params: { params: { id } },
  };
}

const sampleHub = {
  customer: {
    id: 'cust-1', name: 'Anna Garcia', email: 'anna@test.com',
    phone: '600111222', lifecycleStage: 'ACTIVE', healthScore: 75,
    totalSpent: 1200, lastContactedAt: '2026-04-10T10:00:00Z',
  },
  kpis: {
    totalBookings: 3, totalSpent: 1200, pendingPayments: 200,
    lastContactAt: '2026-04-10T10:00:00Z', nextEventDate: '2026-05-20',
  },
  leads: [
    { id: 'l1', name: 'Anna Garcia', status: 'WON', eventType: 'WEDDING', createdAt: '2026-01-15' },
  ],
  bookings: [
    { id: 'b1', reference: 'ORB-001', status: 'COMPLETED', total: 800, date: '2026-03-20' },
  ],
  tasks: [],
  messages: [],
  timeline: [],
  insights: {
    nextAction: { type: 'NONE', label: 'Cap acció pendent', urgency: 'LOW' },
    relationalHealth: 'GOOD',
    ltv: 1200,
    recurrence: 1,
    completedEvents: 1,
    daysSinceLastContact: 8,
    daysSinceLastEvent: 29,
    daysUntilNextEvent: 32,
    openTasksCount: 0,
    pendingPaymentTotal: 200,
  },
};

describe('GET /api/admin/customers/[id]/hub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockFetchCustomerHub.mockResolvedValue(sampleHub);
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(401);
    expect(mockFetchCustomerHub).not.toHaveBeenCalled();
  });

  it('retorna hub complet amb ok:true', async () => {
    const { req, params } = makeRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.customer.id).toBe('cust-1');
    expect(body.data.customer.name).toBe('Anna Garcia');
  });

  it('passa customerId correcte al servei', async () => {
    const { req, params } = makeRequest('cust-xyz');
    await GET(req, params);
    expect(mockFetchCustomerHub).toHaveBeenCalledWith('cust-xyz');
  });

  it('retorna dades de kpis, leads i bookings', async () => {
    const { req, params } = makeRequest();
    const res = await GET(req, params);
    const body = await res.json();
    expect(body.data.kpis.totalBookings).toBe(3);
    expect(body.data.leads).toHaveLength(1);
    expect(body.data.bookings).toHaveLength(1);
    expect(body.data.bookings[0].reference).toBe('ORB-001');
  });

  it('retorna insights amb nextAction i relationalHealth', async () => {
    const { req, params } = makeRequest();
    const res = await GET(req, params);
    const body = await res.json();
    expect(body.data.insights).toBeDefined();
    expect(body.data.insights.relationalHealth).toBe('GOOD');
    expect(body.data.insights.ltv).toBe(1200);
  });

  it('retorna 404 si el client no existeix', async () => {
    mockFetchCustomerHub.mockRejectedValueOnce(new Error('Not found'));
    const { req, params } = makeRequest('inexistent');
    const res = await GET(req, params);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});
