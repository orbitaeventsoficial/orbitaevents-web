import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrisma,
  mockRequireAuth,
  mockGenerateQuoteHTML,
  mockCreateQuoteFromLead,
  mockGenerateQuoteNumber,
  mockResolveQuotePack,
  mockGetQuoteTemplateSettings,
  mockRecordLeadQuoteGenerated,
  mockGetAppBaseUrl,
} = vi.hoisted(() => ({
  mockPrisma: {
    $queryRaw: vi.fn(),
    lead: { updateMany: vi.fn() },
    leadNote: { create: vi.fn() },
    leadDocument: { create: vi.fn() },
  },
  mockRequireAuth: vi.fn(),
  mockGenerateQuoteHTML: vi.fn(),
  mockCreateQuoteFromLead: vi.fn(),
  mockGenerateQuoteNumber: vi.fn(),
  mockResolveQuotePack: vi.fn(),
  mockGetQuoteTemplateSettings: vi.fn(),
  mockRecordLeadQuoteGenerated: vi.fn(),
  mockGetAppBaseUrl: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/services/documentService', () => ({
  generateQuoteHTML: mockGenerateQuoteHTML,
  createQuoteFromLead: mockCreateQuoteFromLead,
  generateQuoteNumber: mockGenerateQuoteNumber,
}));
vi.mock('@/lib/services/quotes/quotePack', () => ({ resolveQuotePack: mockResolveQuotePack }));
vi.mock('@/lib/services/quoteTemplateService', () => ({
  getQuoteTemplateSettings: mockGetQuoteTemplateSettings,
}));
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadQuoteGenerated: mockRecordLeadQuoteGenerated,
}));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: mockGetAppBaseUrl }));

import { handleLeadQuoteGet, handleLeadQuotePost } from '@/lib/services/leads/quoteRouteHandler';
import { NextRequest } from 'next/server';

const LEAD_ID = 'lead-abc';
const MOCK_LEAD = {
  id: LEAD_ID,
  name: 'Maria Garcia',
  email: 'maria@test.com',
  phone: '+34600000000',
  eventType: 'WEDDING',
  eventDate: new Date('2026-09-01'),
  eventLocation: 'Barcelona',
  guestCount: 100,
  budget: '2000',
  message: 'Boda somniada',
  interestedPackId: 'discomovil',
  interestedExtras: [],
  source: 'web',
  preferredLocale: 'ca',
};
const MOCK_PACK = { name: 'Discobodas', price: 1500, djHours: 4 };
const MOCK_TEMPLATE = {
  validityDays: 30,
  introTitle: 'Benvingut',
  introSubtitle: '',
  ctaTitle: 'Contacta',
  ctaSubtitle: '',
  conditions: 'Terms',
};
const MOCK_QUOTE_DATA = { total: 1815, quoteNumber: null as string | null, validUntil: null as Date | null };

function makeGetRequest(url = `http://localhost/api/admin/leads/${LEAD_ID}/quote`) {
  return new NextRequest(url, { method: 'GET' });
}

function makePostRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/admin/leads/${LEAD_ID}/quote`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockReturnValue(null);
  mockPrisma.$queryRaw.mockResolvedValue([MOCK_LEAD]);
  mockPrisma.lead.updateMany.mockResolvedValue({ count: 1 });
  mockPrisma.leadNote.create.mockResolvedValue({});
  mockPrisma.leadDocument.create.mockResolvedValue({});
  mockResolveQuotePack.mockResolvedValue(MOCK_PACK);
  mockGetQuoteTemplateSettings.mockResolvedValue(MOCK_TEMPLATE);
  mockCreateQuoteFromLead.mockReturnValue({ ...MOCK_QUOTE_DATA });
  mockGenerateQuoteHTML.mockReturnValue('<html>Quote</html>');
  mockGenerateQuoteNumber.mockReturnValue('ORB-001');
  mockRecordLeadQuoteGenerated.mockResolvedValue({});
  mockGetAppBaseUrl.mockReturnValue('https://orbitaevents.com');
});

describe('handleLeadQuoteGet', () => {
  it('retorna auth error si no autenticat', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    mockRequireAuth.mockReturnValue(authResponse);

    const result = await handleLeadQuoteGet(makeGetRequest(), LEAD_ID);

    expect(result).toBe(authResponse);
  });

  it('retorna 404 si lead no existeix', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await handleLeadQuoteGet(makeGetRequest(), LEAD_ID);
    const body = await result.json();

    expect(result.status).toBe(404);
    expect(body.error).toBe('Lead no trobat');
  });

  it('retorna HTML amb Content-Type text/html en cas d\'èxit', async () => {
    const result = await handleLeadQuoteGet(makeGetRequest(), LEAD_ID);

    expect(result.status).toBe(200);
    expect(result.headers.get('Content-Type')).toContain('text/html');
    const text = await result.text();
    expect(text).toBe('<html>Quote</html>');
  });

  it('crida resolveQuotePack amb el packId de la querystring', async () => {
    const url = `http://localhost/api/admin/leads/${LEAD_ID}/quote?packId=bodas`;
    await handleLeadQuoteGet(makeGetRequest(url), LEAD_ID);

    expect(mockResolveQuotePack).toHaveBeenCalledWith('bodas', 'ca');
  });

  it('retorna 500 en cas d\'error intern', async () => {
    mockGetQuoteTemplateSettings.mockRejectedValue(new Error('DB error'));

    const result = await handleLeadQuoteGet(makeGetRequest(), LEAD_ID);

    expect(result.status).toBe(500);
  });
});

describe('handleLeadQuotePost', () => {
  it('retorna auth error si no autenticat', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    mockRequireAuth.mockReturnValue(authResponse);

    const result = await handleLeadQuotePost(makePostRequest({}), LEAD_ID);

    expect(result).toBe(authResponse);
  });

  it('retorna 404 si lead no existeix', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await handleLeadQuotePost(makePostRequest({}), LEAD_ID);
    const body = await result.json();

    expect(result.status).toBe(404);
    expect(body.error).toBe('Lead no trobat');
  });

  it('retorna success amb quoteNumber, total i html', async () => {
    const result = await handleLeadQuotePost(makePostRequest({}), LEAD_ID);
    const body = await result.json();

    expect(result.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.quoteNumber).toBe('ORB-001');
    expect(body.total).toBe(1815);
    expect(body.html).toBe('<html>Quote</html>');
  });

  it('actualitza lead status a QUOTE_SENT i crea nota i document', async () => {
    await handleLeadQuotePost(makePostRequest({}), LEAD_ID);

    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: LEAD_ID }, data: { status: 'QUOTE_SENT' } }),
    );
    expect(mockPrisma.leadNote.create).toHaveBeenCalled();
    expect(mockPrisma.leadDocument.create).toHaveBeenCalled();
    expect(mockRecordLeadQuoteGenerated).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: LEAD_ID, quoteNumber: 'ORB-001' }),
    );
  });

  it('retorna 500 en cas d\'error intern', async () => {
    mockGetQuoteTemplateSettings.mockRejectedValue(new Error('DB error'));

    const result = await handleLeadQuotePost(makePostRequest({}), LEAD_ID);

    expect(result.status).toBe(500);
  });
});
