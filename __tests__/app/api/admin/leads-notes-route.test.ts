import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockCreateNote, mockCleanupNotes, mockDeleteNote } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockCreateNote: vi.fn(),
  mockCleanupNotes: vi.fn(),
  mockDeleteNote: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
}));
vi.mock('@/lib/services/leadNoteService', () => ({
  createLeadNote: mockCreateNote,
  cleanupDuplicateLeadNotes: mockCleanupNotes,
  deleteLeadNote: mockDeleteNote,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));

import { POST, PUT, DELETE } from '@/app/api/admin/leads/[id]/notes/route';

function makePostReq(id: string, body: Record<string, unknown>) {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    params: { params: { id } },
  };
}

function makePutReq(id = 'lead-1') {
  return {
    req: new NextRequest(`http://localhost/api/admin/leads/${id}/notes`, { method: 'PUT' }),
    params: { params: { id } },
  };
}

function makeDeleteReq(id = 'lead-1', noteId?: string) {
  const url = noteId
    ? `http://localhost/api/admin/leads/${id}/notes?noteId=${noteId}`
    : `http://localhost/api/admin/leads/${id}/notes`;
  return {
    req: new NextRequest(url, { method: 'DELETE' }),
    params: { params: { id } },
  };
}

describe('POST /api/admin/leads/[id]/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockCreateNote.mockResolvedValue({ status: 200, body: { id: 'note-1', content: 'Hola' } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePostReq('lead-1', { content: 'Nota' });
    const res = await POST(req, params);
    expect(res.status).toBe(401);
  });

  it('crea nota correctament', async () => {
    const { req, params } = makePostReq('lead-1', { content: 'Nota important', createdBy: 'admin' });
    const res = await POST(req, params);
    expect(res.status).toBe(200);
    expect(mockCreateNote).toHaveBeenCalledWith('lead-1', 'Nota important', 'admin');
  });

  it('passa status del servei', async () => {
    mockCreateNote.mockResolvedValueOnce({ status: 400, body: { error: 'Content buit' } });
    const { req, params } = makePostReq('lead-1', {});
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it('retorna 500 si falla', async () => {
    mockCreateNote.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePostReq('lead-1', { content: 'Test' });
    const res = await POST(req, params);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/admin/leads/[id]/notes (cleanup)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockCleanupNotes.mockResolvedValue({ removed: 2 });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makePutReq();
    const res = await PUT(req, params);
    expect(res.status).toBe(401);
  });

  it('neteja duplicats', async () => {
    const { req, params } = makePutReq('lead-1');
    const res = await PUT(req, params);
    expect(res.status).toBe(200);
    expect(mockCleanupNotes).toHaveBeenCalledWith('lead-1');
  });

  it('retorna 500 si falla', async () => {
    mockCleanupNotes.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makePutReq();
    const res = await PUT(req, params);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/admin/leads/[id]/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null);
    mockDeleteNote.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  it('rebutja sense autenticació', async () => {
    mockRequireAuth.mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    );
    const { req, params } = makeDeleteReq('lead-1', 'note-1');
    const res = await DELETE(req, params);
    expect(res.status).toBe(401);
  });

  it('elimina nota amb noteId', async () => {
    const { req, params } = makeDeleteReq('lead-1', 'note-1');
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    expect(mockDeleteNote).toHaveBeenCalledWith('lead-1', 'note-1');
  });

  it('passa null si no hi ha noteId', async () => {
    const { req, params } = makeDeleteReq('lead-1');
    const res = await DELETE(req, params);
    expect(mockDeleteNote).toHaveBeenCalledWith('lead-1', null);
  });

  it('retorna 500 si falla', async () => {
    mockDeleteNote.mockRejectedValueOnce(new Error('DB'));
    const { req, params } = makeDeleteReq('lead-1', 'note-1');
    const res = await DELETE(req, params);
    expect(res.status).toBe(500);
  });
});
