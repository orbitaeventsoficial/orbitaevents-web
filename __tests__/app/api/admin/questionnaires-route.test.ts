import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRequireAuth,
  mockVerifyCsrf,
  mockListQuestionnaireTemplates,
  mockCreateQuestionnaireTemplate,
} = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListQuestionnaireTemplates: vi.fn(),
  mockCreateQuestionnaireTemplate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/questionnaireService', () => ({
  listQuestionnaireTemplates: mockListQuestionnaireTemplates,
  createQuestionnaireTemplate: mockCreateQuestionnaireTemplate,
}));

import { GET, POST } from '@/app/api/admin/questionnaires/route';

const validQuestion = {
  id: 'q1',
  type: 'text',
  label: 'Nom',
  required: true,
};

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/questionnaires', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('/api/admin/questionnaires', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null);
    mockVerifyCsrf.mockReturnValue(null);
    mockListQuestionnaireTemplates.mockResolvedValue([{ id: 'tpl_1', title: 'Pre-event' }]);
    mockCreateQuestionnaireTemplate.mockResolvedValue({ id: 'tpl_1', title: 'Pre-event' });
  });

  it('llista plantilles sense CSRF en lectura', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/questionnaires'));

    expect(res.status).toBe(200);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockListQuestionnaireTemplates).toHaveBeenCalledTimes(1);
    await expect(res.json()).resolves.toEqual([{ id: 'tpl_1', title: 'Pre-event' }]);
  });

  it('rebutja auth abans de CSRF en POST', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response('{}', { status: 401 }));

    const res = await POST(makePostReq({ title: 'Pre-event', questions: [validQuestion] }));

    expect(res.status).toBe(401);
    expect(mockVerifyCsrf).not.toHaveBeenCalled();
    expect(mockCreateQuestionnaireTemplate).not.toHaveBeenCalled();
  });

  it('rebutja CSRF abans de llegir body o crear plantilla', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response('{}', { status: 403 }));
    const req = makePostReq({ title: 'Pre-event', questions: [validQuestion] });

    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(mockVerifyCsrf).toHaveBeenCalledWith(req);
    expect(mockCreateQuestionnaireTemplate).not.toHaveBeenCalled();
  });

  it('retorna 400 si el body no és vàlid', async () => {
    const res = await POST(makePostReq({ title: '', questions: [] }));

    expect(res.status).toBe(400);
    expect(mockCreateQuestionnaireTemplate).not.toHaveBeenCalled();
  });

  it('crea plantilla amb CSRF valid', async () => {
    const payload = {
      title: 'Pre-event',
      description: null,
      questions: [validQuestion],
      isActive: true,
    };

    const res = await POST(makePostReq(payload));

    expect(res.status).toBe(201);
    expect(mockCreateQuestionnaireTemplate).toHaveBeenCalledWith(payload);
    await expect(res.json()).resolves.toEqual({ id: 'tpl_1', title: 'Pre-event' });
  });
});
