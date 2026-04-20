import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockListTasks, mockCreateTask } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockListTasks: vi.fn(),
  mockCreateTask: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/services/leadScopedTaskRouteService', () => ({
  listLeadScopedTasksForRoute: mockListTasks,
  createLeadScopedTaskForRoute: mockCreateTask,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { GET, POST } from '@/app/api/admin/leads/[id]/tasks/route';

function makeGetReq(id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/tasks`),
    params: { params: { id } },
  };
}

function makePostReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/tasks`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

describe('GET /api/admin/leads/[id]/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockListTasks.mockResolvedValue([{ id: 'task-1', title: 'Trucar client' }]);
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(401);
    expect(mockListTasks).not.toHaveBeenCalled();
  });

  it('retorna tasques del lead', async () => {
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 'task-1', title: 'Trucar client' }]);
  });

  it('passa id correcte al servei', async () => {
    const { req, params } = makeGetReq('lead-abc');
    await GET(req, params);
    expect(mockListTasks).toHaveBeenCalledWith('lead-abc');
  });

  it('retorna 500 si falla', async () => {
    mockListTasks.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makeGetReq();
    const res = await GET(req, params);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/admin/leads/[id]/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockCreateTask.mockResolvedValue({ id: 'task-2', title: 'Enviar pressupost' });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePostReq('lead-1', { title: 'Nova tasca' });
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  it('crea tasca correctament', async () => {
    const { req, params } = makePostReq('lead-1', { title: 'Enviar pressupost', priority: 'HIGH' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockCreateTask).toHaveBeenCalledWith('lead-1', { title: 'Enviar pressupost', priority: 'HIGH' });
  });

  it('propaga source del body al servei', async () => {
    const { req, params } = makePostReq('lead-1', { title: 'Tasca amb origen', source: 'AUTOMATION' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockCreateTask).toHaveBeenCalledWith('lead-1', {
      title: 'Tasca amb origen',
      source: 'AUTOMATION',
    });
  });

  it('rebutja title buit', async () => {
    const { req, params } = makePostReq('lead-1', { title: '' });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja status invàlid', async () => {
    const { req, params } = makePostReq('lead-1', { title: 'Test', status: 'INVALID' });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('rebutja priority invàlida', async () => {
    const { req, params } = makePostReq('lead-1', { title: 'Test', priority: 'EXTREME' });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockCreateTask.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePostReq('lead-1', { title: 'Test' });
    const res = await POST(req, params);
    expect(res.status).toBe(500);
  });
});
