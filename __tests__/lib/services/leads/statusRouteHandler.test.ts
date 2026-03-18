import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockRequireAuth, mockNormalizeEmail, mockNormalizeName, mockNormalizePhone } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    customer: { upsert: vi.fn() },
    leadNote: { create: vi.fn() },
    leadActivity: { create: vi.fn() },
    customerActivity: { create: vi.fn() },
  },
  mockRequireAuth: vi.fn(),
  mockNormalizeEmail: vi.fn(),
  mockNormalizeName: vi.fn(),
  mockNormalizePhone: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn() } }));
vi.mock('@/lib/auth', () => ({ requireAuth: mockRequireAuth }));
vi.mock('@/lib/utils/normalize', () => ({
  normalizeEmail: mockNormalizeEmail,
  normalizeName: mockNormalizeName,
  normalizePhone: mockNormalizePhone,
}));
vi.mock('@/lib/constants', () => ({ PLACEHOLDER_EMAIL_DOMAIN: '@placeholder.orbita' }));

import { handleLeadStatusPatch } from '@/lib/services/leads/statusRouteHandler';
import { NextRequest } from 'next/server';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/admin/leads/l1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockReturnValue(null);
  mockPrisma.lead.findUnique.mockResolvedValue(null);
  mockPrisma.lead.update.mockResolvedValue({ id: 'l1', status: 'CONTACTED' });
  mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust1' });
  mockPrisma.leadNote.create.mockResolvedValue({});
  mockPrisma.leadActivity.create.mockResolvedValue({});
  mockPrisma.customerActivity.create.mockResolvedValue({});
  mockNormalizeEmail.mockReturnValue('test@test.com');
  mockNormalizeName.mockReturnValue('test');
  mockNormalizePhone.mockReturnValue('+34600000000');
});

describe('handleLeadStatusPatch', () => {
  it('retorna auth error si no autenticat', async () => {
    const authResponse = new Response(JSON.stringify({ error: 'No auth' }), { status: 401 });
    mockRequireAuth.mockReturnValue(authResponse);

    const result = await handleLeadStatusPatch(makeRequest({ status: 'CONTACTED' }), 'l1');

    expect(result).toBe(authResponse);
  });

  it('retorna 400 amb status invàlid', async () => {
    const result = await handleLeadStatusPatch(makeRequest({ status: 'INVALID' }), 'l1');
    const body = await result.json();

    expect(result.status).toBe(400);
    expect(body.error).toBe('Estat invàlid');
  });

  it('retorna 400 sense status', async () => {
    const result = await handleLeadStatusPatch(makeRequest({}), 'l1');

    expect(result.status).toBe(400);
  });

  it('retorna 404 si lead no existeix', async () => {
    const result = await handleLeadStatusPatch(makeRequest({ status: 'CONTACTED' }), 'l1');

    expect(result.status).toBe(404);
  });

  it('actualitza status correctament', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1',
      status: 'NEW',
      email: 'test@placeholder.orbita',
      customerId: null,
      contactedAt: null,
      convertedAt: null,
    });

    const result = await handleLeadStatusPatch(makeRequest({ status: 'CONTACTED' }), 'l1');
    const body = await result.json();

    expect(result.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockPrisma.lead.update).toHaveBeenCalled();
    expect(mockPrisma.leadNote.create).toHaveBeenCalled();
    expect(mockPrisma.leadActivity.create).toHaveBeenCalled();
  });

  it('crea customer si email real i no linked', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1',
      status: 'NEW',
      email: 'maria@test.com',
      phone: '+34600000000',
      name: 'Maria',
      customerId: null,
      contactedAt: null,
      convertedAt: null,
      source: 'web',
      preferredLocale: 'ca',
    });

    await handleLeadStatusPatch(makeRequest({ status: 'CONTACTED' }), 'l1');

    expect(mockPrisma.customer.upsert).toHaveBeenCalled();
  });

  it('no crea customer si email placeholder', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1',
      status: 'NEW',
      email: 'auto@placeholder.orbita',
      customerId: null,
      contactedAt: null,
      convertedAt: null,
    });

    await handleLeadStatusPatch(makeRequest({ status: 'CONTACTED' }), 'l1');

    expect(mockPrisma.customer.upsert).not.toHaveBeenCalled();
  });

  it('crea customerActivity quan status WON amb customer', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'l1',
      status: 'NEGOTIATING',
      email: 'maria@test.com',
      customerId: 'cust1',
      contactedAt: new Date(),
      convertedAt: null,
      name: 'Maria',
      eventType: 'WEDDING',
    });

    await handleLeadStatusPatch(makeRequest({ status: 'WON' }), 'l1');

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust1',
          action: 'LEAD_CONVERTED',
        }),
      })
    );
  });
});
