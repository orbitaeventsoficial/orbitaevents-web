import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
    booking: { findMany: vi.fn(), findUnique: vi.fn() },
    customerActivity: { findMany: vi.fn() },
    leadActivity: { findMany: vi.fn() },
    adminLog: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), error: vi.fn() } }));

import {
  mapCustomerActivityToCanonicalEvent,
  mapLeadActivityToCanonicalEvent,
  mapAdminLogToCanonicalEvent,
  canonicalEventsToTimeline,
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
      { entity: 'lead', entityId: { in: ['lead-1'] } },
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
      expect.objectContaining({ where: { entity: 'lead', entityId: 'lead-1' } })
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
  it('consulta adminLog booking + inventory + leadActivity si booking té lead', async () => {
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
