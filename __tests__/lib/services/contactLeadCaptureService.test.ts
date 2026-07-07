/**
 * Tests per contactLeadCaptureService — persistència de leads des del formulari web.
 * Mock de Prisma per testejar la lògica de negoci sense BD real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (vi.hoisted per evitar TDZ amb vi.mock hoisting) ────────────────

const { mockPrisma, mockRecordLeadInboundChannelCaptured } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    leadNote: {
      create: vi.fn(),
    },
    customer: {
      upsert: vi.fn(),
    },
    customerActivity: {
      create: vi.fn(),
    },
  },
  mockRecordLeadInboundChannelCaptured: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadInboundChannelCaptured: mockRecordLeadInboundChannelCaptured,
}));

import { persistContactLead } from '@/lib/services/contactLeadCaptureService';

// ─── Helpers ────────────────────────────────────────────────────────────────

const baseInput = {
  name: 'Joan Garcia',
  clientEmail: 'joan@example.com',
  clientPhone: '612345678',
  eventType: 'WEDDING' as const,
  eventDate: '2026-06-15',
  eventLocation: 'Barcelona',
  guestCount: 150,
  estimatedPrice: 2500,
  message: 'Vull la millor festa!',
  source: 'WEBSITE' as const,
  preferredLocale: 'ca',
  updateNote: 'Actualització contacte web',
  createNote: 'Nou contacte via web',
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('persistContactLead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordLeadInboundChannelCaptured.mockResolvedValue(undefined);
  });

  it('crea un lead nou si no existeix cap amb el mateix email', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: 'lead-new-1' });
    mockPrisma.leadNote.create.mockResolvedValue({});
    mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust-1' });
    mockPrisma.lead.update.mockResolvedValue({});
    mockPrisma.customerActivity.create.mockResolvedValue({});

    const result = await persistContactLead(baseInput);

    expect(result.leadId).toBe('lead-new-1');
    expect(mockPrisma.lead.create).toHaveBeenCalledOnce();
    expect(mockPrisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Joan Garcia',
          email: 'joan@example.com',
          eventLocation: 'Barcelona',
          status: 'NEW',
          priority: 'MEDIUM',
        }),
      }),
    );
    expect(mockPrisma.leadNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: 'Nou contacte via web' }),
      }),
    );
  });

  it('actualitza un lead existent si ja existeix el mateix email', async () => {
    const existingLead = {
      id: 'lead-existing',
      phone: '600000000',
      eventDate: null,
      eventLocation: null,
      guestCount: null,
      budget: null,
      message: null,
      interestedPackId: null,
      interestedExtras: [],
      preferredLocale: 'es',
    };
    mockPrisma.lead.findFirst.mockResolvedValue(existingLead);
    mockPrisma.lead.update.mockResolvedValue({ id: 'lead-existing' });
    mockPrisma.leadNote.create.mockResolvedValue({});
    mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust-1' });
    mockPrisma.customerActivity.create.mockResolvedValue({});

    const result = await persistContactLead(baseInput);

    expect(result.leadId).toBe('lead-existing');
    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-existing' },
        data: expect.objectContaining({
          name: 'Joan Garcia',
          phone: '612345678',
          eventType: 'WEDDING',
          eventLocation: 'Barcelona',
        }),
      }),
    );
    expect(mockPrisma.leadNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: 'Actualització contacte web' }),
      }),
    );
  });

  it('genera email placeholder si no hi ha email', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: 'lead-phone' });
    mockPrisma.leadNote.create.mockResolvedValue({});

    const input = { ...baseInput, clientEmail: undefined };
    const result = await persistContactLead(input);

    expect(result.leadId).toBe('lead-phone');
    expect(mockPrisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'phone-612345678@leads.orbitaevents.local',
        }),
      }),
    );
    // No ha de crear customer si no hi ha email real
    expect(mockPrisma.customer.upsert).not.toHaveBeenCalled();
  });

  it('no crea customer si el email és placeholder', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: 'lead-ph' });
    mockPrisma.leadNote.create.mockResolvedValue({});

    const input = {
      ...baseInput,
      clientEmail: 'phone-612345678@leads.orbitaevents.local',
    };
    await persistContactLead(input);

    expect(mockPrisma.customer.upsert).not.toHaveBeenCalled();
  });

  it('fa upsert de Customer amb email real i crea activity', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: 'lead-cust' });
    mockPrisma.leadNote.create.mockResolvedValue({});
    mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust-new' });
    mockPrisma.lead.update.mockResolvedValue({});
    mockPrisma.customerActivity.create.mockResolvedValue({});

    await persistContactLead(baseInput);

    expect(mockPrisma.customer.upsert).toHaveBeenCalledOnce();
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust-new',
          action: 'LEAD_CREATED',
        }),
      }),
    );
    // Vincula lead al customer
    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead-cust' },
        data: { customerId: 'cust-new' },
      }),
    );
  });

  it('gestiona error de BD graciosament i retorna leadId null', async () => {
    mockPrisma.lead.findFirst.mockRejectedValue(new Error('DB connection failed'));

    const result = await persistContactLead(baseInput);

    expect(result.leadId).toBeNull();
  });

  it('continua si el customer upsert falla (error no bloquejant)', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: 'lead-ok' });
    mockPrisma.leadNote.create.mockResolvedValue({});
    mockPrisma.customer.upsert.mockRejectedValue(new Error('Customer upsert fail'));

    const result = await persistContactLead(baseInput);

    // Lead es crea correctament malgrat l'error del customer
    expect(result.leadId).toBe('lead-ok');
  });

  it('usa preferredLocale ca per defecte si no es proporciona', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: 'lead-loc' });
    mockPrisma.leadNote.create.mockResolvedValue({});

    const input = { ...baseInput, clientEmail: undefined, preferredLocale: '' };
    await persistContactLead(input);

    expect(mockPrisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          preferredLocale: 'ca',
        }),
      }),
    );
  });

  it('registra el formulari web com a canal real d’entrada', async () => {
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: 'lead-form-1' });
    mockPrisma.leadNote.create.mockResolvedValue({});
    mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust-form-1' });
    mockPrisma.lead.update.mockResolvedValue({});
    mockPrisma.customerActivity.create.mockResolvedValue({});

    await persistContactLead(baseInput);

    expect(mockRecordLeadInboundChannelCaptured).toHaveBeenCalledWith({
      leadId: 'lead-form-1',
      channel: 'form',
      title: 'Formulari web rebut',
      preview: 'Vull la millor festa!',
      createdBy: 'Captura web',
    });
  });
});
