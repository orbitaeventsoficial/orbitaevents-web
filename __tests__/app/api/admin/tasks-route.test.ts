import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockCreateTask, mockListTasks } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreateTask: vi.fn(),
  mockListTasks: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/tasks/taskAdminService', () => ({
  createAdminTask: mockCreateTask,
  listAdminTasks: mockListTasks,
}));

import { GET, POST } from '@/app/api/admin/tasks/route';

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListTasks.mockResolvedValue({ ok: true, tasks: [] });
    mockCreateTask.mockResolvedValue({ ok: true, task: { id: 'task-1', title: 'Trucar client' } });
  });

  it('llista tasks sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/tasks?status=OPEN&limit=10&page=2'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListTasks).toHaveBeenCalledWith({
      customerId: undefined,
      status: 'OPEN',
      limit: 10,
      page: 2,
    });
  });

  it('rebutja auth abans de CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ title: 'Trucar client' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o crear', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ title: 'Trucar client' });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('crea task amb CSRF valid', async () => {
    const payload = { title: 'Trucar client', status: 'OPEN', priority: 'HIGH' };

    const res = await POST(makePostReq(payload));

    expect(res.status).toBe(200);
    expect(mockCreateTask).toHaveBeenCalledWith(payload);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      task: { id: 'task-1', title: 'Trucar client' },
    });
  });

  it('retorna 400 si el payload no es valid', async () => {
    const res = await POST(makePostReq({ title: '' }));

    expect(res.status).toBe(400);
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it('retorna 500 si falla el servei', async () => {
    mockCreateTask.mockRejectedValueOnce(new Error('DB'));

    const res = await POST(makePostReq({ title: 'Trucar client' }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'Error creant tasca' });
  });
});
