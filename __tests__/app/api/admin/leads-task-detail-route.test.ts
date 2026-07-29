import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockUpdateTask, mockDeleteTask } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockUpdateTask: vi.fn(),
  mockDeleteTask: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/services/leadScopedTaskRouteService', () => ({
  updateLeadScopedTaskForRoute: mockUpdateTask,
  deleteLeadScopedTaskForRoute: mockDeleteTask,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { PATCH, DELETE } from '@/app/api/admin/leads/[id]/tasks/[taskId]/route';

function makePatchReq(id: string, taskId: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id, taskId } },
  };
}

function makeDeleteReq(id = 'lead-1', taskId = 'task-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/tasks/${taskId}`, { method: 'DELETE' }),
    params: { params: { id, taskId } },
  };
}

describe('PATCH /api/admin/leads/[id]/tasks/[taskId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockUpdateTask.mockResolvedValue({ id: 'task-1', status: 'DONE' });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePatchReq('lead-1', 'task-1', { status: 'DONE' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(401);
  });

  it('actualitza tasca correctament', async () => {
    const { req, params } = makePatchReq('lead-1', 'task-1', { status: 'DONE' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(200);
    expect(mockUpdateTask).toHaveBeenCalledWith('lead-1', 'task-1', { status: 'DONE' });
  });

  it('rebutja status invàlid', async () => {
    const { req, params } = makePatchReq('lead-1', 'task-1', { status: 'INVALID' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(400);
  });

  it('retorna 404 si tasca no existeix', async () => {
    mockUpdateTask.mockRejectedValueOnce(new Error('TASK_NOT_FOUND'));
    const { req, params } = makePatchReq('lead-1', 'task-xxx', { status: 'DONE' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(404);
  });

  it('retorna 500 si error genèric', async () => {
    mockUpdateTask.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePatchReq('lead-1', 'task-1', { status: 'DONE' });
    const res = await PATCH(req, params);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/admin/leads/[id]/tasks/[taskId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockDeleteTask.mockResolvedValue({ ok: true });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeDeleteReq();
    const res = await DELETE(req, params);
    expect(res.status).toBe(401);
  });

  it('elimina tasca correctament', async () => {
    const { req, params } = makeDeleteReq('lead-1', 'task-1');
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    expect(mockDeleteTask).toHaveBeenCalledWith('lead-1', 'task-1');
  });

  it('retorna 404 si tasca no existeix', async () => {
    mockDeleteTask.mockRejectedValueOnce(new Error('TASK_NOT_FOUND'));
    const { req, params } = makeDeleteReq('lead-1', 'task-xxx');
    const res = await DELETE(req, params);
    expect(res.status).toBe(404);
  });

  it('retorna 500 si error genèric', async () => {
    mockDeleteTask.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makeDeleteReq();
    const res = await DELETE(req, params);
    expect(res.status).toBe(500);
  });
});
