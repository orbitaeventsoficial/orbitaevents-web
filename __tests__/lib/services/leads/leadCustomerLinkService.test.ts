import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockRecordLeadConverted } = vi.hoisted(() => ({
  mockPrisma: {
    lead: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
  mockRecordLeadConverted: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/customerActivityService', () => ({
  recordLeadConverted: mockRecordLeadConverted,
}));

import {
  linkLeadToCustomer,
  previewLeadCustomerLink,
} from '@/lib/services/leads/leadCustomerLinkService';

beforeEach(() => {
  mockPrisma.lead.findUnique.mockReset();
  mockPrisma.lead.update.mockReset();
  mockPrisma.customer.findMany.mockReset();
  mockPrisma.customer.findUnique.mockReset();
  mockPrisma.customer.findFirst.mockReset();
  mockPrisma.customer.create.mockReset();
  mockRecordLeadConverted.mockReset();
});

describe('previewLeadCustomerLink', () => {
  it('returns lead-not-found when lead does not exist', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    const result = await previewLeadCustomerLink('lead-x');
    expect(result.kind).toBe('lead-not-found');
    expect(mockPrisma.customer.findMany).not.toHaveBeenCalled();
  });

  it('returns already-linked when lead has a customer relation', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-1',
      customerId: 'cust-1',
      name: 'Joan',
      email: 'a@b.cat',
      phone: null,
      dni: null,
      customer: {
        id: 'cust-1',
        name: 'Joan',
        email: 'a@b.cat',
        phone: null,
        dni: null,
      },
    });
    const result = await previewLeadCustomerLink('lead-1');
    expect(result.kind).toBe('already-linked');
    if (result.kind !== 'already-linked') return;
    expect(result.customer.customerId).toBe('cust-1');
    expect(result.customer.customerName).toBe('Joan');
  });

  it('returns no-match when no normalized field is present (placeholder email + 2-char name + no dni/phone)', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-2',
      customerId: null,
      name: 'JJ',
      // ↑ name <3 chars (after normalize) → not searchable
      email: 'web-1234@leads.orbitaevents.local',
      // ↑ placeholder domain triggers email-skip; with no phone/dni/name → no orClauses → early no-match
      phone: null,
      dni: null,
      customer: null,
    });
    const result = await previewLeadCustomerLink('lead-2');
    expect(result.kind).toBe('no-match');
    expect(mockPrisma.customer.findMany).not.toHaveBeenCalled();
  });

  it('finds matches by email/dni/phone and ranks email-strong before phone-only', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-3',
      customerId: null,
      name: 'Joan Garcia',
      email: 'a.b.c@gmail.com',
      phone: '612 345 678',
      dni: '12345678Z',
      customer: null,
    });
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 'cust-phone-only',
        name: 'Telèfon Match',
        email: 'other@x.com',
        phone: '+34612345678',
        dni: null,
        emailNormalized: 'other@x.com',
        phoneNormalized: '+34612345678',
        dniNormalized: null,
        nameNormalized: 'telefon match',
      },
      {
        id: 'cust-email-strong',
        name: 'Email Match',
        email: 'abc@gmail.com',
        phone: null,
        dni: null,
        emailNormalized: 'abc@gmail.com',
        phoneNormalized: null,
        dniNormalized: null,
        nameNormalized: 'email match',
      },
    ]);
    const result = await previewLeadCustomerLink('lead-3');
    expect(result.kind).toBe('matches-found');
    if (result.kind !== 'matches-found') return;
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].customerId).toBe('cust-email-strong');
    expect(result.matches[0].confidence).toBe('strong');
    expect(result.matches[0].matchedBy).toContain('email');
    expect(result.matches[1].customerId).toBe('cust-phone-only');
    expect(result.matches[1].confidence).toBe('medium');
    expect(result.matches[1].matchedBy).toEqual(['phone']);
  });

  it('returns no-match when query returns zero candidates', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-4',
      customerId: null,
      name: 'Anonimitzat',
      email: 'fresh@nou.cat',
      phone: null,
      dni: null,
      customer: null,
    });
    mockPrisma.customer.findMany.mockResolvedValue([]);
    const result = await previewLeadCustomerLink('lead-4');
    expect(result.kind).toBe('no-match');
  });

  it('matches by name alone (medium confidence) when no email/dni/phone match exists', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-name',
      customerId: null,
      name: 'Joan Garcia López',
      email: 'unique@x.cat',
      phone: null,
      dni: null,
      customer: null,
    });
    mockPrisma.customer.findMany.mockResolvedValue([
      {
        id: 'cust-name',
        name: 'Joan Garcia López',
        email: 'jgl@old.com',
        phone: null,
        dni: null,
        emailNormalized: 'jgl@old.com',
        phoneNormalized: null,
        dniNormalized: null,
        nameNormalized: 'joan garcia lopez',
      },
    ]);
    const result = await previewLeadCustomerLink('lead-name');
    expect(result.kind).toBe('matches-found');
    if (result.kind !== 'matches-found') return;
    expect(result.matches[0].matchedBy).toEqual(['name']);
    expect(result.matches[0].confidence).toBe('medium');
  });

  it('skips name matching when normalized name is shorter than 3 chars', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-shortname',
      customerId: null,
      name: 'Jo',
      email: 'placeholder@leads.orbitaevents.local',
      phone: null,
      dni: null,
      customer: null,
    });
    const result = await previewLeadCustomerLink('lead-shortname');
    expect(result.kind).toBe('no-match');
    expect(mockPrisma.customer.findMany).not.toHaveBeenCalled();
  });
});

describe('linkLeadToCustomer — link', () => {
  it('returns 404 when lead missing', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);
    const result = await linkLeadToCustomer({
      leadId: 'lead-x',
      action: 'link',
      customerId: 'cust-1',
    });
    expect(result).toEqual({ ok: false, error: 'Lead no trobat', status: 404 });
  });

  it('returns alreadyLinked when lead already has a customerId, without touching DB', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-1',
      customerId: 'cust-1',
      name: 'Joan',
      email: 'a@b.cat',
      phone: null,
      dni: null,
      eventType: 'WEDDING',
      eventDate: null,
      eventLocation: null,
      guestCount: null,
      budget: null,
      message: null,
      interestedPackId: null,
      interestedExtras: [],
      source: 'WEBSITE',
      preferredLocale: 'ca',
      status: 'NEW',
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      landingPage: null,
    });
    const result = await linkLeadToCustomer({
      leadId: 'lead-1',
      action: 'link',
      customerId: 'cust-1',
    });
    expect(result).toEqual({
      ok: true,
      customerId: 'cust-1',
      created: false,
      alreadyLinked: true,
    });
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
    expect(mockRecordLeadConverted).not.toHaveBeenCalled();
  });

  it('400 when action=link without customerId', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-2',
      customerId: null,
      name: 'Maria',
      email: 'm@x.cat',
      phone: null,
      dni: null,
      eventType: 'BIRTHDAY',
      eventDate: null,
      eventLocation: null,
      guestCount: null,
      budget: null,
      message: null,
      interestedPackId: null,
      interestedExtras: [],
      source: 'WEBSITE',
      preferredLocale: 'ca',
      status: 'NEW',
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      landingPage: null,
    });
    const result = await linkLeadToCustomer({ leadId: 'lead-2', action: 'link' });
    expect(result).toEqual({ ok: false, error: 'Cal customerId per vincular', status: 400 });
  });

  it('404 when target customer does not exist', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-3',
      customerId: null,
      name: 'Maria',
      email: 'm@x.cat',
      phone: null,
      dni: null,
      eventType: 'BIRTHDAY',
      eventDate: null,
      eventLocation: null,
      guestCount: null,
      budget: null,
      message: null,
      interestedPackId: null,
      interestedExtras: [],
      source: 'WEBSITE',
      preferredLocale: 'ca',
      status: 'NEW',
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      landingPage: null,
    });
    mockPrisma.customer.findUnique.mockResolvedValue(null);
    const result = await linkLeadToCustomer({
      leadId: 'lead-3',
      action: 'link',
      customerId: 'cust-x',
    });
    expect(result).toEqual({ ok: false, error: 'Client no trobat', status: 404 });
  });

  it('happy path: links lead to existing customer, updates lead, records activity', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: 'lead-4',
      customerId: null,
      name: 'Maria',
      email: 'm@x.cat',
      phone: null,
      dni: null,
      eventType: 'BIRTHDAY',
      eventDate: null,
      eventLocation: null,
      guestCount: null,
      budget: null,
      message: null,
      interestedPackId: null,
      interestedExtras: [],
      source: 'WEBSITE',
      preferredLocale: 'ca',
      status: 'NEW',
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      landingPage: null,
    });
    mockPrisma.customer.findUnique.mockResolvedValue({ id: 'cust-7' });
    mockPrisma.lead.update.mockResolvedValue({});

    const result = await linkLeadToCustomer({
      leadId: 'lead-4',
      action: 'link',
      customerId: 'cust-7',
      actor: 'Test',
    });

    expect(result).toEqual({
      ok: true,
      customerId: 'cust-7',
      created: false,
      alreadyLinked: false,
    });
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-4' },
      data: { customerId: 'cust-7' },
    });
    expect(mockRecordLeadConverted).toHaveBeenCalledOnce();
    const args = mockRecordLeadConverted.mock.calls[0][0];
    expect(args.customerId).toBe('cust-7');
    expect(args.leadId).toBe('lead-4');
    expect(args.attribution.manualAction).toBe('link');
    expect(args.attribution.actor).toBe('Test');
  });
});

describe('linkLeadToCustomer — create', () => {
  const baseLead = {
    id: 'lead-c',
    customerId: null,
    name: 'Joan Garcia',
    email: 'JOAN.GARCIA@EXAMPLE.COM',
    phone: '612 345 678',
    dni: '12345678Z',
    eventType: 'WEDDING',
    eventDate: null,
    eventLocation: null,
    guestCount: null,
    budget: null,
    message: null,
    interestedPackId: null,
    interestedExtras: [],
    source: 'WEBSITE',
    preferredLocale: 'ca',
    status: 'NEW',
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    landingPage: null,
  };

  it('400 when lead has placeholder email', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      ...baseLead,
      email: 'placeholder@leads.orbitaevents.local',
    });
    const result = await linkLeadToCustomer({ leadId: 'lead-c', action: 'create' });
    expect(result).toEqual({
      ok: false,
      error: 'El lead no té email vàlid per crear un client nou',
      status: 400,
    });
  });

  it('409 when an existing customer matches by email', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(baseLead);
    mockPrisma.customer.findFirst.mockResolvedValue({ id: 'existing-1' });
    const result = await linkLeadToCustomer({ leadId: 'lead-c', action: 'create' });
    expect(result).toEqual({
      ok: false,
      error: 'Ja existeix un client amb aquest email o DNI. Cal vincular en lloc de crear.',
      status: 409,
    });
    expect(mockPrisma.customer.create).not.toHaveBeenCalled();
  });

  it('happy path: creates customer with normalized fields, links lead, records activity', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(baseLead);
    mockPrisma.customer.findFirst.mockResolvedValue(null);
    mockPrisma.customer.create.mockResolvedValue({ id: 'cust-new' });
    mockPrisma.lead.update.mockResolvedValue({});

    const result = await linkLeadToCustomer({
      leadId: 'lead-c',
      action: 'create',
      actor: 'Admin',
    });

    expect(result).toEqual({
      ok: true,
      customerId: 'cust-new',
      created: true,
      alreadyLinked: false,
    });
    expect(mockPrisma.customer.create).toHaveBeenCalledOnce();
    const data = mockPrisma.customer.create.mock.calls[0][0].data;
    expect(data.email).toBe('joan.garcia@example.com');
    expect(data.emailNormalized).toBe('joan.garcia@example.com');
    expect(data.phone).toBe('612 345 678');
    expect(data.phoneNormalized).toBe('+34612345678');
    expect(data.dniNormalized).toBe('12345678Z');
    expect(data.preferredLocale).toBe('ca');
    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'lead-c' },
      data: { customerId: 'cust-new' },
    });
    expect(mockRecordLeadConverted).toHaveBeenCalledOnce();
    expect(mockRecordLeadConverted.mock.calls[0][0].attribution.manualAction).toBe('create');
  });
});
