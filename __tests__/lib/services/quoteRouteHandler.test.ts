import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockRecordLeadQuoteGenerated } = vi.hoisted(() => ({
  mockPrisma: {
    $queryRaw: vi.fn(),
    lead: { updateMany: vi.fn() },
    leadNote: { create: vi.fn() },
    leadDocument: { create: vi.fn() },
  },
  mockRecordLeadQuoteGenerated: vi.fn(),
}));

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { requireAuth: vi.fn() },
}));

const { mockDocService } = vi.hoisted(() => ({
  mockDocService: {
    generateQuoteHTML: vi.fn(),
    createQuoteFromLead: vi.fn(),
    generateQuoteNumber: vi.fn(),
  },
}));

const { mockQuotePack } = vi.hoisted(() => ({
  mockQuotePack: { resolveQuotePack: vi.fn() },
}));

const { mockTemplateService } = vi.hoisted(() => ({
  mockTemplateService: { getQuoteTemplateSettings: vi.fn() },
}));

const { mockSite } = vi.hoisted(() => ({
  mockSite: { getAppBaseUrl: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => mockAuth);
vi.mock('@/lib/services/documentService', () => mockDocService);
vi.mock('@/lib/services/quotes/quotePack', () => mockQuotePack);
vi.mock('@/lib/services/quoteTemplateService', () => mockTemplateService);
vi.mock('@/lib/site', () => mockSite);
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadQuoteGenerated: mockRecordLeadQuoteGenerated,
}));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { handleLeadQuoteGet, handleLeadQuotePost } from '@/lib/services/leads/quoteRouteHandler';

const defaultTemplate = {
  validityDays: 30,
  introTitle: 'Pressupost',
  introSubtitle: 'Per al teu event',
  ctaTitle: 'Reserva',
  ctaSubtitle: 'Contacta',
  conditions: 'Condicions generals',
};

const defaultLead = {
  id: 'lead1',
  name: 'Test Client',
  email: 'test@test.com',
  phone: null,
  eventType: 'WEDDING',
  eventDate: new Date('2026-06-15'),
  eventLocation: 'Barcelona',
  guestCount: 100,
  budget: '2000',
  message: null,
  interestedPackId: 'premium',
  interestedExtras: null,
  source: 'web',
  preferredLocale: 'ca',
};

const defaultPack = {
  name: 'Premium',
  price: 1500,
  djHours: 6,
  description: 'Pack Premium',
};

function makeRequest(url: string, method = 'GET', body?: Record<string, unknown>) {
  const req = {
    url,
    method,
    json: vi.fn().mockResolvedValue(body || {}),
    headers: new Map([['authorization', 'Basic dGVzdDp0ZXN0']]),
  };
  return req as unknown as import('next/server').NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.requireAuth.mockReturnValue(null); // no auth error
  mockTemplateService.getQuoteTemplateSettings.mockResolvedValue(defaultTemplate);
  mockQuotePack.resolveQuotePack.mockResolvedValue(defaultPack);
  mockDocService.generateQuoteHTML.mockReturnValue('<html>quote</html>');
  mockDocService.createQuoteFromLead.mockReturnValue({
    total: 1500,
    validUntil: null,
    quoteNumber: null,
  });
  mockDocService.generateQuoteNumber.mockReturnValue('ORB-2026-001');
  mockSite.getAppBaseUrl.mockReturnValue('http://localhost:3000');
  mockPrisma.$queryRaw.mockResolvedValue([defaultLead]);
  mockPrisma.lead.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.leadNote.create.mockResolvedValue({ id: 'n1' });
  mockPrisma.leadDocument.create.mockResolvedValue({ id: 'd1' });
  mockRecordLeadQuoteGenerated.mockResolvedValue({ id: 'a1' });
});

// ═══════════════════════════════════════════════════════════════════════════
// GET
// ═══════════════════════════════════════════════════════════════════════════

describe('handleLeadQuoteGet', () => {
  it('retorna HTML del pressupost', async () => {
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote');

    const res = await handleLeadQuoteGet(req, 'lead1');

    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(mockQuotePack.resolveQuotePack).toHaveBeenCalledWith('premium', 'ca');
    expect(mockDocService.createQuoteFromLead).toHaveBeenCalled();
    expect(mockDocService.generateQuoteHTML).toHaveBeenCalled();
  });

  it('retorna 404 si lead no existeix', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);
    const req = makeRequest('http://localhost:3000/api/admin/leads/nonexist/quote');

    const res = await handleLeadQuoteGet(req, 'nonexist');

    expect(res.status).toBe(404);
  });

  it('retorna auth error si no autenticat', async () => {
    const authResponse = { status: 401 };
    mockAuth.requireAuth.mockReturnValue(authResponse);
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote');

    const res = await handleLeadQuoteGet(req, 'lead1');

    expect(res.status).toBe(401);
  });

  it('accepta customPrice i customHours', async () => {
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote?customPrice=2000&customHours=8');

    await handleLeadQuoteGet(req, 'lead1');

    expect(mockDocService.createQuoteFromLead).toHaveBeenCalledWith(
      defaultLead,
      expect.objectContaining({ price: 2000, djHours: 8 }),
    );
  });

  it('usa packId del searchParam si present', async () => {
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote?packId=basic');

    await handleLeadQuoteGet(req, 'lead1');

    expect(mockQuotePack.resolveQuotePack).toHaveBeenCalledWith('basic', 'ca');
  });

  it('retorna 500 si hi ha error intern', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB error'));
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote');

    const res = await handleLeadQuoteGet(req, 'lead1');

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST
// ═══════════════════════════════════════════════════════════════════════════

describe('handleLeadQuotePost', () => {
  it('genera pressupost i actualitza lead', async () => {
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote', 'POST', {
      packId: 'premium',
    });

    const res = await handleLeadQuotePost(req, 'lead1');
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.quoteNumber).toBe('ORB-2026-001');
    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
      where: { id: 'lead1' },
      data: { status: 'QUOTE_SENT' },
    });
  });

  it('crea nota, document i activitat', async () => {
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote', 'POST');

    await handleLeadQuotePost(req, 'lead1');

    expect(mockPrisma.leadNote.create).toHaveBeenCalled();
    expect(mockPrisma.leadDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead1',
        type: 'QUOTE',
        source: 'AUTO',
        mimeType: 'text/html',
      }),
    });
    expect(mockRecordLeadQuoteGenerated).toHaveBeenCalledWith({
      leadId: 'lead1',
      quoteNumber: 'ORB-2026-001',
      total: 1500,
    });
  });

  it('retorna 404 si lead no existeix', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote', 'POST');

    const res = await handleLeadQuotePost(req, 'lead1');

    expect(res.status).toBe(404);
  });

  it('accepta customPrice i customHours al body', async () => {
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote', 'POST', {
      customPrice: 2500,
      customHours: 10,
    });

    await handleLeadQuotePost(req, 'lead1');

    expect(mockDocService.createQuoteFromLead).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ price: 2500, djHours: 10 }),
      undefined,
    );
  });

  it('accepta eventLocation override al body', async () => {
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote', 'POST', {
      eventLocation: 'Madrid',
    });

    await handleLeadQuotePost(req, 'lead1');

    expect(mockDocService.createQuoteFromLead).toHaveBeenCalledWith(
      expect.objectContaining({ eventLocation: 'Madrid' }),
      expect.anything(),
      undefined,
    );
  });

  it('retorna 500 si hi ha error intern', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('DB error'));
    const req = makeRequest('http://localhost:3000/api/admin/leads/lead1/quote', 'POST');

    const res = await handleLeadQuotePost(req, 'lead1');

    expect(res.status).toBe(500);
  });
});
