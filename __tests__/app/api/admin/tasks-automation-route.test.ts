import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockRunTaskAutomation,
  mockGenerateDailyChecklistTasks,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockRunTaskAutomation: vi.fn(),
  mockGenerateDailyChecklistTasks: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/services/tasks/taskAutomationService', () => ({
  runTaskAutomation: mockRunTaskAutomation,
}));
vi.mock('@/lib/services/dailyChecklist', () => ({
  generateDailyChecklistTasks: mockGenerateDailyChecklistTasks,
}));

import { POST as POST_AUTO } from '@/app/api/admin/tasks/auto/route';
import { POST as POST_DAILY } from '@/app/api/admin/tasks/daily-checklist/route';

describe('POST /api/admin/tasks/auto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockRunTaskAutomation.mockResolvedValue({ created: 2 });
  });

  it('rebutja auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST_AUTO(new NextRequest('http://localhost/api/admin/tasks/auto', { method: 'POST' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockRunTaskAutomation).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans del servei', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/tasks/auto', { method: 'POST' });

    const res = await POST_AUTO(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockRunTaskAutomation).not.toHaveBeenCalled();
  });

  it('executa automatitzacio amb CSRF valid', async () => {
    const req = new NextRequest('http://localhost/api/admin/tasks/auto', { method: 'POST' });

    const res = await POST_AUTO(req);

    expect(res.status).toBe(200);
    expect(mockRunTaskAutomation).toHaveBeenCalledTimes(1);
    await expect(res.json()).resolves.toEqual({ ok: true, created: 2 });
  });

  it('retorna 500 si falla el servei', async () => {
    mockRunTaskAutomation.mockRejectedValueOnce(new Error('DB'));

    const res = await POST_AUTO(new NextRequest('http://localhost/api/admin/tasks/auto', { method: 'POST' }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "No s'ha pogut executar l'automatització",
    });
  });
});

describe('POST /api/admin/tasks/daily-checklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGenerateDailyChecklistTasks.mockResolvedValue({ created: 3 });
  });

  it('rebutja auth abans de CSRF', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST_DAILY(new NextRequest('http://localhost/api/admin/tasks/daily-checklist', { method: 'POST' }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGenerateDailyChecklistTasks).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans del servei', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/tasks/daily-checklist', { method: 'POST' });

    const res = await POST_DAILY(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockGenerateDailyChecklistTasks).not.toHaveBeenCalled();
  });

  it('genera checklist diari amb CSRF valid', async () => {
    const res = await POST_DAILY(new NextRequest('http://localhost/api/admin/tasks/daily-checklist', { method: 'POST' }));

    expect(res.status).toBe(200);
    expect(mockGenerateDailyChecklistTasks).toHaveBeenCalledTimes(1);
    await expect(res.json()).resolves.toEqual({ ok: true, created: 3 });
  });

  it('retorna 500 si falla el servei', async () => {
    mockGenerateDailyChecklistTasks.mockRejectedValueOnce(new Error('DB'));

    const res = await POST_DAILY(new NextRequest('http://localhost/api/admin/tasks/daily-checklist', { method: 'POST' }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'No s’ha pogut generar el checklist diari',
    });
  });
});
