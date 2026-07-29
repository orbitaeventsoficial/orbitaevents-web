import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
    booking: { findMany: vi.fn(), findUnique: vi.fn() },
    customerActivity: { findMany: vi.fn() },
    leadActivity: { findMany: vi.fn() },
    adminLog: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));

import {
  mapCustomerActivityToCanonicalEvent,
  mapLeadActivityToCanonicalEvent,
  mapAdminLogToCanonicalEvent,
  canonicalEventsToTimeline,
  summarizeCanonicalCommunicationMetrics,
  fetchRecentCanonicalEvents,
  fetchRecentCanonicalCommunicationMetrics,
  fetchRecentCommercialSequenceMetrics,
  fetchCanonicalCommunicationEventsForBookings,
  fetchCanonicalAdminActivityPage,
  fetchCanonicalEventsForCustomer,
  fetchCanonicalEventsForLead,
  fetchCanonicalEventsForBooking,
} from '@/lib/services/timelineQueryService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.booking.findUnique.mockResolvedValue(null);
  mockPrisma.customerActivity.findMany.mockResolvedValue([]);
  mockPrisma.leadActivity.findMany.mockResolvedValue([]);
  mockPrisma.adminLog.findMany.mockResolvedValue([]);
  mockPrisma.adminLog.count.mockResolvedValue(0);
  mockPrisma.adminLog.groupBy.mockResolvedValue([]);
});

// ───────────────────────────────────────────────────────────────────────────
// MAPPERS (purs, sense BD)
// ───────────────────────────────────────────────────────────────────────────

describe('mapCustomerActivityToCanonicalEvent', () => {
  it('mapeja NOTE_ADDED amb títol localitzat', () => {
    const event = mapCustomerActivityToCanonicalEvent({
      id: 'ca-1',
      action: 'NOTE_ADDED',
      createdAt: new Date('2026-01-01T10:00:00Z'),
    });
    expect(event.source).toBe('customerActivity');
    expect(event.kind).toBe('activity');
    expect(event.title).toBe('Nota interna afegida');
    expect(event.timelineType).toBe('NOTE_ADDED');
    expect(event.id).toBe('ca:ca-1');
  });

  it('fallback a ACTIVITY si acció desconeguda', () => {
    const event = mapCustomerActivityToCanonicalEvent({
      id: 'ca-2',
      action: 'UNKNOWN_XYZ',
      createdAt: new Date(),
    });
    expect(event.timelineType).toBe('ACTIVITY');
    expect(event.title).toBe('UNKNOWN_XYZ');
  });

  it('mapeja decisio post-event registrada amb lectura humana', () => {
    const event = mapCustomerActivityToCanonicalEvent({
      id: 'ca-post',
      action: 'POST_EVENT_RECURRENCE_DECIDED',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      details: {
        actionKey: 'testimonial',
        bookingRef: 'OE-2026-001',
        safety: 'DECIDED_NOT_SENT',
        draft: 'Hola Maria, em deixaries un testimoni curt?',
      },
    });

    expect(event.title).toBe('Testimoni sol.licitat');
    expect(event.body).toContain('Ref. OE-2026-001');
    expect(event.body).toContain('Registrat, no enviat');
    expect(event.timelineType).toBe('ACTIVITY');
    expect(event.metadata).toMatchObject({ actionKey: 'testimonial' });
  });

  it('mapeja esborrany social post-event sense exposar codis interns', () => {
    const event = mapCustomerActivityToCanonicalEvent({
      id: 'ca-social',
      action: 'POST_EVENT_RECURRENCE_DECIDED',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      details: {
        actionKey: 'social_post',
        bookingRef: 'OE-2026-002',
        safety: 'DRAFT_NOT_PUBLISHED',
        socialPostId: 'social-1',
        draft: 'Bolo pendent de revisar abans de publicar.',
      },
    });

    expect(event.title).toBe('Social preparat');
    expect(event.body).toContain('Esborrany social, no publicat');
    expect(event.body).toContain('Esborrany social social-1');
    expect(event.body).not.toContain('DRAFT_NOT_PUBLISHED');
  });

  it('mapeja accions comercials de referral i reactivacio amb titol llegible', () => {
    const referral = mapCustomerActivityToCanonicalEvent({
      id: 'ca-referral',
      action: 'REFERRAL_ASK_PREPARED',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      details: { note: 'Canal: clipboard\nMotiu: VIP sense referral\n\nMissatge referral' },
    });
    const reactivation = mapCustomerActivityToCanonicalEvent({
      id: 'ca-reactivation',
      action: 'REACTIVATION_PREPARED',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      details: { note: 'Canal: inbox\nMotiu: VIP dormant\n\nMissatge reactivacio' },
    });

    expect(referral.title).toBe('Referral preparat');
    expect(referral.body).toContain('VIP sense referral');
    expect(reactivation.title).toBe('Reactivacio preparada');
    expect(reactivation.body).toContain('VIP dormant');
  });

  it('mapeja moderacio de testimoni amb titol i resum llegibles', () => {
    const event = mapCustomerActivityToCanonicalEvent({
      id: 'ca-testimonial-approved',
      action: 'TESTIMONIAL_APPROVED',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      details: {
        testimonialId: 'test-1',
        rating: 5,
        eventType: 'WEDDING',
        textPreview: 'La festa va anar molt be.',
      },
    });

    expect(event.title).toBe('Testimoni aprovat');
    expect(event.body).toContain('5/5');
    expect(event.body).toContain('WEDDING');
    expect(event.body).toContain('La festa va anar molt be.');
  });
});

describe('mapLeadActivityToCanonicalEvent', () => {
  it('mapeja EMAIL a MESSAGE_SENT', () => {
    const event = mapLeadActivityToCanonicalEvent({
      id: 'la-1',
      type: 'EMAIL',
      title: 'Email enviat',
      description: 'Cos del missatge',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      createdBy: 'Admin',
      leadId: 'lead-1',
    });
    expect(event.timelineType).toBe('MESSAGE_SENT');
    expect(event.kind).toBe('message');
    expect(event.link?.href).toBe('/admin/leads/lead-1');
    expect(event.body).toBe('Cos del missatge');
  });

  it('mapeja TASK a task kind', () => {
    const event = mapLeadActivityToCanonicalEvent({
      id: 'la-2',
      type: 'TASK',
      title: 'Tasca nova',
      description: null,
      createdAt: new Date(),
      createdBy: null,
      leadId: 'lead-2',
    });
    expect(event.timelineType).toBe('TASK_CREATED');
    expect(event.kind).toBe('task');
  });

  it('preserva metadata de leadActivity per comunicacions', () => {
    const event = mapLeadActivityToCanonicalEvent({
      id: 'la-3',
      type: 'WHATSAPP',
      title: 'WhatsApp enviat',
      description: 'Missatge curt',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      createdBy: 'Admin',
      leadId: 'lead-3',
      metadata: { channel: 'whatsapp', providerMessageId: 'wamid-1' },
    });

    expect(event.timelineType).toBe('WHATSAPP_SENT');
    expect(event.metadata).toEqual({ channel: 'whatsapp', providerMessageId: 'wamid-1' });
  });
});

describe('mapAdminLogToCanonicalEvent', () => {
  it('etiqueta STATUS_CHANGE de booking amb from/to', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-1',
      action: 'STATUS_CHANGE',
      entity: 'booking',
      entityId: 'b-1',
      details: { from: 'PENDING', to: 'CONFIRMED' },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      userId: 'admin',
    });
    expect(event.title).toBe("Canvi d'estat de la reserva");
    expect(event.body).toBe('PENDING -> CONFIRMED');
    expect(event.timelineType).toBe('BOOKING_CONFIRMED');
    expect(event.link?.href).toBe('/admin/bookings/b-1');
  });

  it('mapeja proposal SEND a PROPOSAL_SENT', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-2',
      action: 'SEND',
      entity: 'proposal',
      entityId: 'p-1',
      details: null,
      createdAt: new Date(),
      userId: null,
    });
    expect(event.timelineType).toBe('PROPOSAL_SENT');
    expect(event.title).toBe('Pressupost enviat');
  });

  it('mapeja traça documental de pressupost enviat amb body reconstruible', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-prop-doc',
      action: 'DOCUMENT_PROPOSAL_SENT',
      entity: 'proposal',
      entityId: 'prop-1',
      details: {
        documentType: 'PROPOSAL',
        source: 'admin_proposal_send',
        reference: 'OE-Q-2026-001',
        proposalReference: 'OE-Q-2026-001',
        total: 1500,
        to: 'maria@test.com',
      },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      userId: null,
    });

    expect(event.title).toBe('Pressupost enviat');
    expect(event.body).toBe('Ref. OE-Q-2026-001 · a maria@test.com · 1500.00 EUR · admin_proposal_send');
    expect(event.timelineType).toBe('PROPOSAL_SENT');
    expect(event.link?.label).toBe('Obrir pressupost');
    expect(event.link?.href).toBe('/admin/presupuestos?proposalId=prop-1');
  });

  it('mapeja traça documental de contracte amb CTA especific', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-contract-doc',
      action: 'DOCUMENT_CONTRACT_SENT',
      entity: 'proposal',
      entityId: 'prop-2',
      details: {
        documentType: 'CONTRACT',
        source: 'admin_contract_send',
        reference: 'CTR-2026-001',
        contractReference: 'CTR-2026-001',
        to: 'maria@test.com',
      },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      userId: null,
    });

    expect(event.title).toBe('Contracte enviat');
    expect(event.body).toBe('Ref. CTR-2026-001 · a maria@test.com · admin_contract_send');
    expect(event.timelineType).toBe('ACTIVITY');
    expect(event.link).toEqual({
      label: 'Obrir contracte',
      href: '/admin/presupuestos?proposalId=prop-2',
    });
  });

  it('mapeja traça documental de dossier amb origen i CTA al preview guardat', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-dossier-doc',
      action: 'DOCUMENT_DOSSIER_SENT',
      entity: 'dossier',
      entityId: 'dos-1',
      details: {
        documentType: 'DOSSIER',
        source: 'dossier_email_send',
        dossierId: 'dos-1',
        leadId: 'lead-1',
        customerId: 'cust-1',
        to: 'joan@test.com',
      },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      userId: null,
    });

    expect(event.title).toBe('Dossier enviat');
    expect(event.body).toBe('a joan@test.com · dossier_email_send');
    expect(event.link).toEqual({
      label: 'Obrir dossier',
      href: '/api/admin/dossiers/dos-1/preview',
    });
    expect(event.metadata).toMatchObject({
      dossierId: 'dos-1',
      leadId: 'lead-1',
      customerId: 'cust-1',
    });
  });

  it('manté fallback a la llista de dossiers si la traça no porta dossierId', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-dossier-doc-empty',
      action: 'DOCUMENT_DOSSIER_SENT',
      entity: 'dossier',
      entityId: null,
      details: {
        documentType: 'DOSSIER',
        source: 'dossier_email_send',
      },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      userId: null,
    });

    expect(event.link).toEqual({
      label: 'Obrir dossiers',
      href: '/admin/dossiers',
    });
  });

  it('mapeja factura PDF amb CTA directe al document', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-invoice-doc',
      action: 'DOCUMENT_INVOICE_PDF_GENERATED',
      entity: 'invoice',
      entityId: 'inv-1',
      details: {
        documentType: 'INVOICE',
        source: 'invoice_service_create',
        reference: 'FAC-2026-001',
        bookingId: 'b-1',
        customerId: 'cust-1',
        pdfUrl: 'https://cdn.test/factura.pdf',
      },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      userId: null,
    });

    expect(event.title).toBe('PDF factura generat');
    expect(event.body).toBe('Ref. FAC-2026-001 · invoice_service_create');
    expect(event.link).toEqual({
      label: 'Obrir factura',
      href: 'https://cdn.test/factura.pdf',
    });
  });

  it('mapeja albarà sense PDF cap a documents de reserva', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-delivery-doc',
      action: 'DOCUMENT_DELIVERY_NOTE_CREATED',
      entity: 'deliveryNote',
      entityId: 'dn-1',
      details: {
        documentType: 'DELIVERY_NOTE',
        source: 'admin_delivery_note_create',
        reference: 'ALB-2026-001',
        bookingId: 'b-1',
        customerId: 'cust-1',
      },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      userId: null,
    });

    expect(event.title).toBe('Albarà creat');
    expect(event.body).toBe('Ref. ALB-2026-001 · admin_delivery_note_create');
    expect(event.link).toEqual({
      label: 'Veure documents',
      href: '/admin/bookings/b-1#sec-documents',
    });
  });

  it('mapeja PAYMENT_RECORDED de Stripe com a activitat de reserva llegible', () => {
    const event = mapAdminLogToCanonicalEvent({
      id: 'al-3',
      action: 'PAYMENT_RECORDED',
      entity: 'booking',
      entityId: 'b-1',
      details: {
        message: 'Pagament Stripe registrat: paga i senyal',
        source: 'stripe',
        paymentType: 'deposit',
        stripeSessionId: 'cs_deposit',
        amountCents: 30000,
      },
      createdAt: new Date('2026-01-01T10:00:00Z'),
      userId: null,
    });

    expect(event.title).toBe('Pagament registrat');
    expect(event.body).toBe('Pagament Stripe registrat: paga i senyal');
    expect(event.timelineType).toBe('BOOKING_CREATED');
    expect(event.link?.href).toBe('/admin/bookings/b-1');
    expect(event.metadata).toMatchObject({
      source: 'stripe',
      paymentType: 'deposit',
      stripeSessionId: 'cs_deposit',
      amountCents: 30000,
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────
// canonicalEventsToTimeline
// ───────────────────────────────────────────────────────────────────────────

describe('canonicalEventsToTimeline', () => {
  it('ordena per data descendent', () => {
    const events = [
      mapCustomerActivityToCanonicalEvent({
        id: 'a',
        action: 'NOTE_ADDED',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
      mapCustomerActivityToCanonicalEvent({
        id: 'b',
        action: 'NOTE_ADDED',
        createdAt: new Date('2026-01-03T00:00:00Z'),
      }),
      mapCustomerActivityToCanonicalEvent({
        id: 'c',
        action: 'NOTE_ADDED',
        createdAt: new Date('2026-01-02T00:00:00Z'),
      }),
    ];
    const timeline = canonicalEventsToTimeline(events);
    expect(timeline.map((e) => e.id)).toEqual(['ca:b', 'ca:c', 'ca:a']);
  });

  it('propaga meta amb source/entityType/kind', () => {
    const [event] = canonicalEventsToTimeline([
      mapAdminLogToCanonicalEvent({
        id: 'al-x',
        action: 'CREATE',
        entity: 'booking',
        entityId: 'b-x',
        details: null,
        createdAt: new Date(),
        userId: null,
      }),
    ]);
    expect(event.meta).toMatchObject({
      source: 'adminLog',
      entityType: 'booking',
      kind: 'booking',
    });
  });
});

describe('summarizeCanonicalCommunicationMetrics', () => {
  it('compta enviaments i respostes a partir dels events canònics', () => {
    const metrics = summarizeCanonicalCommunicationMetrics([
      mapAdminLogToCanonicalEvent({
        id: 'al-1',
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: 'b-1',
        details: { flow: 'quote', channel: 'email' },
        createdAt: new Date('2026-01-01T10:00:00Z'),
        userId: 'admin',
      }),
      mapAdminLogToCanonicalEvent({
        id: 'al-2',
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: 'b-1',
        details: { flow: 'quote', channel: 'whatsapp' },
        createdAt: new Date('2026-01-01T11:00:00Z'),
        userId: 'admin',
      }),
      mapAdminLogToCanonicalEvent({
        id: 'al-3',
        action: 'COMM_RESPONDED',
        entity: 'booking',
        entityId: 'b-1',
        details: { flow: 'quote' },
        createdAt: new Date('2026-01-01T12:00:00Z'),
        userId: null,
      }),
    ]);

    expect(metrics).toEqual({
      commSent: 2,
      commResponded: 1,
      responseRate: 0.5,
    });
  });
});

// ───────────────────────────────────────────────────────────────────────────
// FETCHERS UNIFICATS
// ───────────────────────────────────────────────────────────────────────────

describe('fetchCanonicalEventsForCustomer', () => {
  it('consulta leads i bookings del customer abans de creuar activitats', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 'lead-1' }, { id: 'lead-2' }]);
    mockPrisma.booking.findMany.mockResolvedValue([{ id: 'booking-1' }]);

    await fetchCanonicalEventsForCustomer('cust-1');

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-1' },
      select: { id: true },
    });
    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-1' },
      select: { id: true },
    });
  });

  it('inclou adminLog per customer + leads + bookings', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 'lead-1' }]);
    mockPrisma.booking.findMany.mockResolvedValue([{ id: 'booking-1' }]);

    await fetchCanonicalEventsForCustomer('cust-1');

    const adminLogCall = mockPrisma.adminLog.findMany.mock.calls[0][0];
    expect(adminLogCall.where.OR).toEqual([
      { entity: 'customer', entityId: 'cust-1' },
      { entity: 'dossier', details: { path: ['customerId'], equals: 'cust-1' } },
      { entity: 'lead', entityId: { in: ['lead-1'] } },
      { entity: 'dossier', details: { path: ['leadId'], equals: 'lead-1' } },
      { entity: 'booking', entityId: { in: ['booking-1'] } },
    ]);
  });

  it('no consulta leadActivity si no hi ha leads', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);

    await fetchCanonicalEventsForCustomer('cust-1');

    expect(mockPrisma.leadActivity.findMany).not.toHaveBeenCalled();
  });

  it('fusiona i ordena els events de les 3 fonts per data descendent', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([{ id: 'lead-1' }]);
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.customerActivity.findMany.mockResolvedValue([
      { id: 'ca-1', action: 'NOTE_ADDED', details: null, createdAt: new Date('2026-01-02T10:00:00Z') },
    ]);
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      {
        id: 'la-1',
        type: 'EMAIL',
        title: 'Email',
        description: null,
        createdAt: new Date('2026-01-03T10:00:00Z'),
        createdBy: 'Admin',
        leadId: 'lead-1',
      },
    ]);
    mockPrisma.adminLog.findMany.mockResolvedValue([
      {
        id: 'al-1',
        action: 'CREATE',
        entity: 'booking',
        entityId: 'b-1',
        details: null,
        createdAt: new Date('2026-01-01T10:00:00Z'),
        userId: null,
      },
    ]);

    const events = await fetchCanonicalEventsForCustomer('cust-1');
    expect(events.map((e) => e.id)).toEqual(['la:la-1', 'ca:ca-1', 'al:al-1']);
  });

  it('aplica el limit final al conjunt fusionat', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.customerActivity.findMany.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        id: `ca-${i}`,
        action: 'NOTE_ADDED',
        details: null,
        createdAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
      }))
    );

    const events = await fetchCanonicalEventsForCustomer('cust-1', 2);
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('ca:ca-4');
    expect(events[1].id).toBe('ca:ca-3');
  });

  it('retorna array buit si prisma peta (safeFetch)', async () => {
    mockPrisma.lead.findMany.mockRejectedValue(new Error('db down'));
    mockPrisma.booking.findMany.mockRejectedValue(new Error('db down'));
    mockPrisma.customerActivity.findMany.mockRejectedValue(new Error('db down'));
    mockPrisma.adminLog.findMany.mockRejectedValue(new Error('db down'));

    const events = await fetchCanonicalEventsForCustomer('cust-1');
    expect(events).toEqual([]);
  });
});

describe('fetchCanonicalEventsForLead', () => {
  it('consulta leadActivity i adminLog filtrats per leadId', async () => {
    await fetchCanonicalEventsForLead('lead-1');

    expect(mockPrisma.leadActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { leadId: 'lead-1' } })
    );
    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { entity: 'lead', entityId: 'lead-1' },
            { entity: 'dossier', details: { path: ['leadId'], equals: 'lead-1' } },
          ],
        },
      })
    );
  });

  it('fusiona i ordena events de lead', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      {
        id: 'la-1',
        type: 'NOTE',
        title: 'Nota',
        description: null,
        createdAt: new Date('2026-01-02T10:00:00Z'),
        createdBy: null,
        leadId: 'lead-1',
      },
    ]);
    mockPrisma.adminLog.findMany.mockResolvedValue([
      {
        id: 'al-1',
        action: 'UPDATE',
        entity: 'lead',
        entityId: 'lead-1',
        details: null,
        createdAt: new Date('2026-01-03T10:00:00Z'),
        userId: null,
      },
    ]);

    const events = await fetchCanonicalEventsForLead('lead-1');
    expect(events.map((e) => e.id)).toEqual(['al:al-1', 'la:la-1']);
  });

  it('propaga metadata de leadActivity al fetcher de lead', async () => {
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      {
        id: 'la-meta',
        type: 'EMAIL',
        title: 'Email enviat',
        description: null,
        createdAt: new Date('2026-01-02T10:00:00Z'),
        createdBy: 'Admin',
        leadId: 'lead-1',
        metadata: { templateSlug: 'welcome', channel: 'email' },
      },
    ]);

    const events = await fetchCanonicalEventsForLead('lead-1');
    expect(events[0].metadata).toEqual({ templateSlug: 'welcome', channel: 'email' });
  });
});

describe('fetchCanonicalEventsForBooking', () => {
  it('consulta adminLog booking + inventory + documents + leadActivity si booking té lead', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ leadId: 'lead-1' });

    await fetchCanonicalEventsForBooking('b-1');

    // booking adminLog
    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { entity: 'booking', entityId: 'b-1' } })
    );
    // inventory adminLog
    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { entity: 'booking_inventory', details: { path: ['bookingId'], equals: 'b-1' } },
      })
    );
    // document adminLogs
    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { entity: 'invoice', details: { path: ['bookingId'], equals: 'b-1' } },
            { entity: 'deliveryNote', details: { path: ['bookingId'], equals: 'b-1' } },
          ],
        },
      })
    );
    // lead activities
    expect(mockPrisma.leadActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { leadId: 'lead-1' } })
    );
  });

  it('no consulta leadActivity si booking no té lead', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ leadId: null });

    await fetchCanonicalEventsForBooking('b-1');

    expect(mockPrisma.leadActivity.findMany).not.toHaveBeenCalled();
  });

  it('fusiona events de múltiples fonts ordenats per data', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ leadId: 'lead-1' });
    mockPrisma.adminLog.findMany
      .mockResolvedValueOnce([
        { id: 'al-1', action: 'STATUS_CHANGE', entity: 'booking', entityId: 'b-1', details: { from: 'PENDING', to: 'CONFIRMED' }, createdAt: new Date('2026-01-01T10:00:00Z'), userId: 'admin' },
      ])
      .mockResolvedValueOnce([
        { id: 'al-inv', action: 'CREATE', entity: 'booking_inventory', entityId: 'inv-1', details: { bookingId: 'b-1', itemCode: 'MIC-01' }, createdAt: new Date('2026-01-02T10:00:00Z'), userId: null },
      ]);
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      { id: 'la-1', type: 'NOTE', title: 'Nota', description: 'test', createdAt: new Date('2026-01-01T08:00:00Z'), createdBy: 'user', leadId: 'lead-1' },
    ]);

    const events = await fetchCanonicalEventsForBooking('b-1');
    expect(events).toHaveLength(3);
    // Most recent first
    expect(events[0].id).toBe('al:al-inv');
    expect(events[1].id).toBe('al:al-1');
    expect(events[2].id).toBe('la:la-1');
  });

  it('inclou traces documentals de factura i albarà filtrades per bookingId', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ leadId: null });
    mockPrisma.adminLog.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'al-invoice',
          action: 'DOCUMENT_INVOICE_PDF_GENERATED',
          entity: 'invoice',
          entityId: 'inv-1',
          details: {
            documentType: 'INVOICE',
            source: 'invoice_service_create',
            reference: 'FAC-2026-001',
            bookingId: 'b-1',
            pdfUrl: 'https://cdn.test/factura.pdf',
          },
          createdAt: new Date('2026-01-03T10:00:00Z'),
          userId: null,
        },
        {
          id: 'al-delivery',
          action: 'DOCUMENT_DELIVERY_NOTE_CREATED',
          entity: 'deliveryNote',
          entityId: 'dn-1',
          details: {
            documentType: 'DELIVERY_NOTE',
            source: 'admin_delivery_note_create',
            reference: 'ALB-2026-001',
            bookingId: 'b-1',
          },
          createdAt: new Date('2026-01-02T10:00:00Z'),
          userId: null,
        },
      ]);

    const events = await fetchCanonicalEventsForBooking('b-1');

    expect(events.map((event) => event.id)).toEqual(['al:al-invoice', 'al:al-delivery']);
    expect(events[0]).toMatchObject({
      title: 'PDF factura generat',
      link: { label: 'Obrir factura', href: 'https://cdn.test/factura.pdf' },
    });
    expect(events[1]).toMatchObject({
      title: 'Albarà creat',
      link: { label: 'Veure documents', href: '/admin/bookings/b-1#sec-documents' },
    });
  });

  it('retorna events canònics amb kind=booking i link correcte', async () => {
    mockPrisma.adminLog.findMany
      .mockResolvedValueOnce([
        {
          id: 'al-1',
          action: 'STATUS_CHANGE',
          entity: 'booking',
          entityId: 'b-1',
          details: { from: 'PENDING', to: 'CONFIRMED' },
          createdAt: new Date('2026-01-01T10:00:00Z'),
          userId: 'admin',
        },
      ])
      .mockResolvedValueOnce([]);

    const events = await fetchCanonicalEventsForBooking('b-1');
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('booking');
    expect(events[0].entityType).toBe('booking');
    expect(events[0].link?.href).toBe('/admin/bookings/b-1');
    expect(events[0].title).toBe("Canvi d'estat de la reserva");
  });

  it('respecta el limit passat', async () => {
    await fetchCanonicalEventsForBooking('b-1', 30);
    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 30 })
    );
  });

  it('retorna array buit si totes les queries fallen', async () => {
    mockPrisma.booking.findUnique.mockRejectedValue(new Error('db down'));
    mockPrisma.adminLog.findMany.mockRejectedValue(new Error('db down'));
    const events = await fetchCanonicalEventsForBooking('b-1');
    expect(events).toEqual([]);
  });
});

describe('fetchRecentCanonicalEvents', () => {
  it('fusiona customerActivity, leadActivity i adminLog per data descendent', async () => {
    mockPrisma.customerActivity.findMany.mockResolvedValue([
      { id: 'ca-1', action: 'NOTE_ADDED', details: null, createdAt: new Date('2026-01-02T10:00:00Z') },
    ]);
    mockPrisma.leadActivity.findMany.mockResolvedValue([
      {
        id: 'la-1',
        type: 'EMAIL',
        title: 'Email',
        description: 'Cos',
        createdAt: new Date('2026-01-03T10:00:00Z'),
        createdBy: 'Admin',
        leadId: 'lead-1',
      },
    ]);
    mockPrisma.adminLog.findMany.mockResolvedValue([
      {
        id: 'al-1',
        action: 'CREATE',
        entity: 'booking',
        entityId: 'b-1',
        details: null,
        createdAt: new Date('2026-01-01T10:00:00Z'),
        userId: null,
      },
    ]);

    const events = await fetchRecentCanonicalEvents(5);
    expect(events.map((event) => event.id)).toEqual(['la:la-1', 'ca:ca-1', 'al:al-1']);
  });

  it('respecta el límit final', async () => {
    mockPrisma.customerActivity.findMany.mockResolvedValue(
      Array.from({ length: 4 }, (_, i) => ({
        id: `ca-${i}`,
        action: 'NOTE_ADDED',
        details: null,
        createdAt: new Date(`2026-01-0${i + 1}T10:00:00Z`),
      }))
    );
    mockPrisma.leadActivity.findMany.mockResolvedValue([]);
    mockPrisma.adminLog.findMany.mockResolvedValue([]);

    const events = await fetchRecentCanonicalEvents(2);
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('ca:ca-3');
    expect(events[1].id).toBe('ca:ca-2');
  });
});

describe('fetchRecentCanonicalCommunicationMetrics', () => {
  it('llegeix COMM_SENT/COMM_RESPONDED i en deriva mètriques canòniques', async () => {
    mockPrisma.adminLog.findMany.mockResolvedValue([
      {
        id: 'al-1',
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: 'b-1',
        details: { flow: 'quote', channel: 'email' },
        createdAt: new Date('2026-01-01T10:00:00Z'),
        userId: 'admin',
      },
      {
        id: 'al-2',
        action: 'COMM_RESPONDED',
        entity: 'booking',
        entityId: 'b-1',
        details: { flow: 'quote' },
        createdAt: new Date('2026-01-01T11:00:00Z'),
        userId: null,
      },
    ]);

    const metrics = await fetchRecentCanonicalCommunicationMetrics(new Date('2025-12-31T00:00:00Z'));

    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
          createdAt: { gte: new Date('2025-12-31T00:00:00Z') },
        },
      })
    );
    expect(metrics).toEqual({
      commSent: 1,
      commResponded: 1,
      responseRate: 1,
    });
  });
});

describe('fetchRecentCommercialSequenceMetrics', () => {
  it('llegeix COMM_SEQUENCE_EXEC des d’una sola mètrica shared', async () => {
    mockPrisma.adminLog.count.mockResolvedValue(7);

    const result = await fetchRecentCommercialSequenceMetrics(new Date('2025-12-31T00:00:00Z'));

    expect(mockPrisma.adminLog.count).toHaveBeenCalledWith({
      where: {
        action: 'COMM_SEQUENCE_EXEC',
        createdAt: { gte: new Date('2025-12-31T00:00:00Z') },
      },
    });
    expect(result).toEqual({ sequenceExec: 7 });
  });
});

describe('fetchCanonicalCommunicationEventsForBookings', () => {
  it('agrupa per booking els COMM_SENT/COMM_RESPONDED ja mapejats a capa canònica', async () => {
    mockPrisma.adminLog.findMany.mockResolvedValue([
      {
        id: 'al-1',
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: 'b-1',
        details: { flow: 'payment', channel: 'email' },
        createdAt: new Date('2026-01-01T10:00:00Z'),
        userId: 'admin',
      },
      {
        id: 'al-2',
        action: 'COMM_RESPONDED',
        entity: 'booking',
        entityId: 'b-2',
        details: { flow: 'payment' },
        createdAt: new Date('2026-01-01T11:00:00Z'),
        userId: null,
      },
    ]);

    const grouped = await fetchCanonicalCommunicationEventsForBookings(['b-1', 'b-2'], 2000);

    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          entity: 'booking',
          entityId: { in: ['b-1', 'b-2'] },
          action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
        },
        take: 2000,
      })
    );
    expect(grouped['b-1']?.[0]?.title).toBe('Email enviat');
    expect(grouped['b-2']?.[0]?.title).toBe('Resposta rebuda');
  });
});

describe('fetchCanonicalAdminActivityPage', () => {
  it('llegeix adminLog paginat i retorna timeline canònica per cada fila', async () => {
    mockPrisma.adminLog.findMany.mockResolvedValue([
      {
        id: 'al-1',
        action: 'COMM_SENT',
        entity: 'booking',
        entityId: 'b-1',
        details: { flow: 'quote', channel: 'email' },
        createdAt: new Date('2026-01-01T10:00:00Z'),
        userId: 'admin',
      },
    ]);
    mockPrisma.adminLog.count.mockResolvedValue(1);

    const result = await fetchCanonicalAdminActivityPage({
      since: new Date('2025-12-31T00:00:00Z'),
      category: 'comms',
      page: 2,
      limit: 25,
    });

    expect(mockPrisma.adminLog.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: { gte: new Date('2025-12-31T00:00:00Z') },
        action: {
          in: [
            'COMM_SENT',
            'COMM_RESPONDED',
            'COMM_SEQUENCE_EXEC',
            'COMM_SEQUENCE_BATCH',
            'SEND_POST_EVENT_EMAIL',
            'PAYMENT_REMINDER_SENT',
            'DOCUMENT_PROPOSAL_SENT',
            'DOCUMENT_DOSSIER_SENT',
            'DOCUMENT_CONTRACT_SENT',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: 25,
      take: 25,
    });
    expect(result.logs[0]).toMatchObject({
      id: 'al-1',
      category: 'comms',
      createdAt: '2026-01-01T10:00:00.000Z',
      timeline: {
        id: 'al:al-1',
        source: 'adminLog',
        title: 'Email enviat',
      },
    });
    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.pages).toBe(1);
  });

  it('agrega estadístiques per categoria des del groupBy', async () => {
    mockPrisma.adminLog.groupBy.mockResolvedValue([
      { action: 'COMM_SENT', _count: 4 },
      { action: 'AUTOMATION_RUN_ALL', _count: 2 },
      { action: 'DELETE', _count: 1 },
    ]);

    const result = await fetchCanonicalAdminActivityPage({
      since: new Date('2025-12-31T00:00:00Z'),
    });

    expect(mockPrisma.adminLog.groupBy).toHaveBeenCalledWith({
      by: ['action'],
      where: { createdAt: { gte: new Date('2025-12-31T00:00:00Z') } },
      _count: true,
      orderBy: { _count: { action: 'desc' } },
    });
    expect(result.stats).toEqual({
      comms: { total: 4, actions: { COMM_SENT: 4 } },
      automation: { total: 2, actions: { AUTOMATION_RUN_ALL: 2 } },
      crud: { total: 1, actions: { DELETE: 1 } },
    });
  });

  it('retorna buit si la categoria no mapeja cap acció coneguda', async () => {
    const result = await fetchCanonicalAdminActivityPage({
      since: new Date('2025-12-31T00:00:00Z'),
      category: 'unknown',
      page: 3,
      limit: 10,
    });

    expect(mockPrisma.adminLog.findMany).not.toHaveBeenCalled();
    expect(result).toEqual({
      logs: [],
      total: 0,
      stats: {},
      page: 3,
      pages: 0,
    });
  });
});
