import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockGetLeadDetail, mockUpdateLead, mockDeleteLead } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetLeadDetail: vi.fn(),
  mockUpdateLead: vi.fn(),
  mockDeleteLead: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/services/leadRouteService', () => ({
  getLeadDetail: mockGetLeadDetail,
  updateLeadFromInput: mockUpdateLead,
  deleteLeadIfAllowed: mockDeleteLead,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { GET, PATCH, DELETE } from '@/app/api/admin/leads/[id]/route';

function makeGetRequest(id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}`),
    params: { params: { id } },
  };
}

function makePatchRequest(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

function makeDeleteRequest(id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}`, { method: 'DELETE' }),
    params: { params: { id } },
  };
}

const sampleLead = {
  id: 'lead-1',
  name: 'Jordi Puig',
  email: 'jordi@test.com',
  phone: '600222333',
  status: 'CONTACTED',
  priority: 'HIGH',
  eventType: 'CORPORATE',
  eventDate: '2026-06-20',
  budget: '1200',
  source: 'WEBSITE',
  createdAt: '2026-04-01T10:00:00Z',
};

describe('GET /api/admin/leads/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockGetLeadDetail.mockResolvedValue({ status: 200, body: { lead: sampleLead } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeGetRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(401);
    expect(mockGetLeadDetail).not.toHaveBeenCalled();
  });

  it('retorna lead amb totes les dades', async () => {
    const { req, params } = makeGetRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lead.id).toBe('lead-1');
    expect(body.lead.name).toBe('Jordi Puig');
    expect(body.lead.status).toBe('CONTACTED');
    expect(body.lead.eventType).toBe('CORPORATE');
  });

  it('passa id correcte al servei', async () => {
    const { req, params } = makeGetRequest('lead-xyz');
    await GET(req, params);
    expect(mockGetLeadDetail).toHaveBeenCalledWith('lead-xyz');
  });

  it('retorna 404 si lead no existeix', async () => {
    mockGetLeadDetail.mockResolvedValueOnce({ status: 404, body: { error: 'Lead no trobat' } });
    const { req, params } = makeGetRequest('inexistent');
    const res = await GET(req, params);
    expect(res.status).toBe(404);
  });

  it('retorna 500 si el servei falla', async () => {
    mockGetLeadDetail.mockRejectedValueOnce(new Error('DB error'));
    const { req, params } = makeGetRequest();
    const res = await GET(req, params);
    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/admin/leads/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockUpdateLead.mockResolvedValue({ status: 200, body: { lead: { ...sampleLead, status: 'QUOTE_SENT' } } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePatchRequest('lead-1', { status: 'QUOTE_SENT' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(401);
  });

  it('actualitza status correctament', async () => {
    const { req, params } = makePatchRequest('lead-1', { status: 'QUOTE_SENT' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    expect(mockUpdateLead).toHaveBeenCalledWith('lead-1', { status: 'QUOTE_SENT' });
  });

  it('rebutja amb dades invàlides', async () => {
    const { req, params } = makePatchRequest('lead-1', { status: 'INVALID_STATUS' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('invàlid');
  });

  it('rebutja camps desconeguts (strict)', async () => {
    const { req, params } = makePatchRequest('lead-1', { unknownField: 'test' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja eventDate ambigu al PATCH', async () => {
    const { req, params } = makePatchRequest('lead-1', { eventDate: '26 Setiembre' });
    const res = await PATCH(req, params);

    expect(res.status).toBe(400);
    expect(mockUpdateLead).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/admin/leads/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockDeleteLead.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeDeleteRequest();
    const res = await DELETE(req, params);
    expect(res.status).toBe(401);
  });

  it('elimina correctament', async () => {
    const { req, params } = makeDeleteRequest('lead-1');
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    expect(mockDeleteLead).toHaveBeenCalledWith('lead-1');
  });
});
