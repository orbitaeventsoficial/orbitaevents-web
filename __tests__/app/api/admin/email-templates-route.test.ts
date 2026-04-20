import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAuth, mockVerifyCsrf, mockListTemplates, mockUpsert, mockGetDetail } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockVerifyCsrf: vi.fn(),
  mockListTemplates: vi.fn(),
  mockUpsert: vi.fn(),
  mockGetDetail: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/csrf', () => ({ verifyCsrf: mockVerifyCsrf }));
vi.mock('@/lib/services/emailTemplateService', () => ({
  listTemplates: mockListTemplates,
  upsertTemplate: mockUpsert,
  getAdminTemplateDetail: mockGetDetail,
}));
vi.mock('@/lib/site', () => ({ absoluteUrl: (p: string) => `http://localhost${p}` }));

import { GET as ListGET, POST } from '@/app/api/admin/email-templates/route';
import { GET as DetailGET } from '@/app/api/admin/email-templates/[slug]/route';

describe('GET /api/admin/email-templates (list)', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockListTemplates.mockResolvedValue([{ slug: 'welcome', subject: 'Benvingut' }]); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await ListGET(new NextRequest('http://localhost/api/admin/email-templates'))).status).toBe(401);
  });

  it('retorna plantilles', async () => {
    const res = await ListGET(new NextRequest('http://localhost/api/admin/email-templates'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.templates).toHaveLength(1);
  });
});

describe('POST /api/admin/email-templates', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockVerifyCsrf.mockReturnValue(null); mockUpsert.mockResolvedValue({ slug: 'welcome', subject: 'Nou' }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    const req = new NextRequest('http://localhost/api/admin/email-templates', { method: 'POST', body: JSON.stringify({ slug: 'welcome', locale: 'ca', subject: 'Hola' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(401);
  });

  it('rebutja sense CSRF', async () => {
    mockVerifyCsrf.mockReturnValueOnce(new Response(JSON.stringify({ error: 'CSRF' }), { status: 403 }));
    const req = new NextRequest('http://localhost/api/admin/email-templates', { method: 'POST', body: JSON.stringify({ slug: 'welcome', locale: 'ca', subject: 'Hola' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(403);
  });

  it('crea/actualitza plantilla', async () => {
    const req = new NextRequest('http://localhost/api/admin/email-templates', { method: 'POST', body: JSON.stringify({ slug: 'welcome', locale: 'ca', subject: 'Benvingut', bodyHtml: '<p>Hola</p>' }), headers: { 'Content-Type': 'application/json' } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith({ slug: 'welcome', locale: 'ca', subject: 'Benvingut', bodyHtml: '<p>Hola</p>' });
  });

  it('rebutja sense slug', async () => {
    const req = new NextRequest('http://localhost/api/admin/email-templates', { method: 'POST', body: JSON.stringify({ locale: 'ca', subject: 'Hola' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(400);
  });

  it('rebutja sense locale', async () => {
    const req = new NextRequest('http://localhost/api/admin/email-templates', { method: 'POST', body: JSON.stringify({ slug: 'welcome', subject: 'Hola' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(400);
  });

  it('rebutja sense subject', async () => {
    const req = new NextRequest('http://localhost/api/admin/email-templates', { method: 'POST', body: JSON.stringify({ slug: 'welcome', locale: 'ca' }), headers: { 'Content-Type': 'application/json' } });
    expect((await POST(req)).status).toBe(400);
  });
});

describe('GET /api/admin/email-templates/[slug]', () => {
  beforeEach(() => { vi.clearAllMocks(); mockRequireAuth.mockReturnValue(null); mockGetDetail.mockResolvedValue({ status: 200, body: { slug: 'welcome', subject: 'Hola' } }); });

  it('rebutja sense auth', async () => {
    mockRequireAuth.mockReturnValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }));
    expect((await DetailGET(new NextRequest('http://localhost/api/admin/email-templates/welcome'), { params: Promise.resolve({ slug: 'welcome' }) })).status).toBe(401);
  });

  it('retorna detall amb locale per defecte ca', async () => {
    const res = await DetailGET(new NextRequest('http://localhost/api/admin/email-templates/welcome'), { params: Promise.resolve({ slug: 'welcome' }) });
    expect(res.status).toBe(200);
    expect(mockGetDetail).toHaveBeenCalledWith(expect.objectContaining({ slug: 'welcome', locale: 'ca' }));
  });

  it('respecta locale query param', async () => {
    await DetailGET(new NextRequest('http://localhost/api/admin/email-templates/welcome?locale=es'), { params: Promise.resolve({ slug: 'welcome' }) });
    expect(mockGetDetail).toHaveBeenCalledWith(expect.objectContaining({ locale: 'es' }));
  });
});
