import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockGetQuestionnaireTemplate,
  mockUpdateQuestionnaireTemplate,
  mockDeleteQuestionnaireTemplate,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockGetQuestionnaireTemplate: vi.fn(),
  mockUpdateQuestionnaireTemplate: vi.fn(),
  mockDeleteQuestionnaireTemplate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/questionnaireService', () => ({
  getQuestionnaireTemplate: mockGetQuestionnaireTemplate,
  updateQuestionnaireTemplate: mockUpdateQuestionnaireTemplate,
  deleteQuestionnaireTemplate: mockDeleteQuestionnaireTemplate,
}));

import { DELETE, GET, PATCH } from '@/app/api/admin/questionnaires/[id]/route';

const params = { params: { id: 'tpl_1' } };

function makePatchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/questionnaires/tpl_1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDeleteReq() {
  return new NextRequest('http://localhost/api/admin/questionnaires/tpl_1', { method: 'DELETE' });
}

describe('/api/admin/questionnaires/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockGetQuestionnaireTemplate.mockResolvedValue({ id: 'tpl_1', title: 'Pre-event' });
    mockUpdateQuestionnaireTemplate.mockResolvedValue({ id: 'tpl_1', title: 'Updated' });
    mockDeleteQuestionnaireTemplate.mockResolvedValue(undefined);
  });

  it('retorna plantilla sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/questionnaires/tpl_1'), params);

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetQuestionnaireTemplate).toHaveBeenCalledWith('tpl_1');
    await expect(res.json()).resolves.toEqual({ id: 'tpl_1', title: 'Pre-event' });
  });

  it('rebutja auth abans de CSRF en PATCH', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await PATCH(makePatchReq({ title: 'Updated' }), params);

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockGetQuestionnaireTemplate).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de consultar o actualitzar en PATCH', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePatchReq({ title: 'Updated' });

    const res = await PATCH(req, params);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockGetQuestionnaireTemplate).not.toHaveBeenCalled();
    expect(mockUpdateQuestionnaireTemplate).not.toHaveBeenCalled();
  });

  it('retorna 404 en PATCH si no existeix', async () => {
    mockGetQuestionnaireTemplate.mockResolvedValueOnce(null);

    const res = await PATCH(makePatchReq({ title: 'Updated' }), params);

    expect(res.status).toBe(404);
    expect(mockUpdateQuestionnaireTemplate).not.toHaveBeenCalled();
  });

  it('actualitza plantilla amb CSRF valid', async () => {
    const res = await PATCH(makePatchReq({ title: 'Updated' }), params);

    expect(res.status).toBe(200);
    expect(mockUpdateQuestionnaireTemplate).toHaveBeenCalledWith('tpl_1', { title: 'Updated' });
    await expect(res.json()).resolves.toEqual({ id: 'tpl_1', title: 'Updated' });
  });

  it('rebutja CSRF abans de consultar o eliminar en DELETE', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makeDeleteReq();

    const res = await DELETE(req, params);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockGetQuestionnaireTemplate).not.toHaveBeenCalled();
    expect(mockDeleteQuestionnaireTemplate).not.toHaveBeenCalled();
  });

  it('elimina plantilla amb CSRF valid', async () => {
    const res = await DELETE(makeDeleteReq(), params);

    expect(res.status).toBe(200);
    expect(mockDeleteQuestionnaireTemplate).toHaveBeenCalledWith('tpl_1');
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
