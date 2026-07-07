import { describe, expect, it } from 'vitest';

import {
  buildCustomerActivityTimelineEvents,
  buildCustomerBusinessTimelineEvents,
  buildTimeline,
} from '@/lib/customer-hub/timeline';

describe('buildTimeline', () => {
  it('preserva metadata útil de comunicació per a la timeline del customer hub', () => {
    const events = buildTimeline({
      proposals: [],
      bookings: [],
      tasks: [],
      messages: [
        {
          id: 'msg-1',
          channel: 'EMAIL',
          direction: 'INBOUND',
          subject: 'Resposta client',
          bodyPreview: 'El client demana disponibilitat per dissabte.',
          createdAt: '2026-04-16T10:00:00.000Z',
          sentAt: '2026-04-16T10:00:00.000Z',
          leadId: 'lead-1',
        },
      ],
      customerActivities: [],
      leadActivities: [],
      adminLogs: [],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'EMAIL_RECEIVED',
      title: 'Email rebut: Resposta client',
      meta: {
        channel: 'EMAIL',
        direction: 'INBOUND',
        preview: 'El client demana disponibilitat per dissabte.',
      },
      link: {
        label: 'Veure entrada',
        href: '/admin/leads/lead-1',
      },
    });
  });

  it('pot consumir events canònics preservant el preview a la timeline', () => {
    const events = buildCustomerActivityTimelineEvents({
      customerActivities: [],
      leadActivities: [],
      adminLogs: [],
      canonicalEvents: [
        {
          id: 'la:msg-1',
          source: 'leadActivity',
          entityType: 'lead',
          entityId: 'lead-1',
          kind: 'message',
          title: 'Resposta client',
          body: 'El client demana disponibilitat per dissabte.',
          occurredAt: '2026-04-16T10:00:00.000Z',
          metadata: { channel: 'EMAIL', direction: 'INBOUND' },
          timelineType: 'EMAIL_RECEIVED',
          link: { label: 'Veure entrada', href: '/admin/leads/lead-1' },
        },
      ],
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'EMAIL_RECEIVED',
      title: 'Resposta client',
      meta: {
        channel: 'EMAIL',
        direction: 'INBOUND',
        preview: 'El client demana disponibilitat per dissabte.',
      },
      link: {
        label: 'Veure entrada',
        href: '/admin/leads/lead-1',
      },
    });
  });

  it('separa els events de negoci dels d’activitat i després els combina ordenats', () => {
    const business = buildCustomerBusinessTimelineEvents({
      proposals: [{
        id: 'prop-1',
        reference: 'P-001',
        customerId: 'cust-1',
        leadId: 'lead-1',
        bookingId: 'booking-1',
        status: 'SENT',
        total: 1000,
        createdAt: '2026-04-10T10:00:00.000Z',
        sentAt: '2026-04-11T10:00:00.000Z',
      }],
      bookings: [],
      tasks: [],
      messages: [],
    });

    expect(business.map((event) => event.type)).toEqual(['PROPOSAL_CREATED', 'PROPOSAL_SENT']);
    expect(business[1]).toMatchObject({
      link: {
        label: 'Obrir pressupost',
        href: '/admin/presupuestos?proposalId=prop-1',
      },
      originLinks: [
        { label: 'Client origen', href: '/admin/clientes/cust-1' },
        { label: 'Entrada origen', href: '/admin/leads/lead-1' },
        { label: 'Reserva origen', href: '/admin/bookings/booking-1' },
      ],
    });

    const combined = buildTimeline({
      proposals: [],
      bookings: [],
      tasks: [],
      messages: [],
      customerActivities: [],
      leadActivities: [],
      adminLogs: [],
      canonicalEvents: [
        {
          id: 'la:msg-1',
          source: 'leadActivity',
          entityType: 'lead',
          entityId: 'lead-1',
          kind: 'message',
          title: 'Resposta client',
          body: 'El client demana disponibilitat per dissabte.',
          occurredAt: '2026-04-16T10:00:00.000Z',
          metadata: { channel: 'EMAIL', direction: 'INBOUND' },
          timelineType: 'EMAIL_RECEIVED',
          link: { label: 'Veure entrada', href: '/admin/leads/lead-1' },
        },
      ],
    });

    expect(combined).toHaveLength(1);
    expect(combined[0]).toMatchObject({
      type: 'EMAIL_RECEIVED',
      title: 'Resposta client',
      meta: {
        channel: 'EMAIL',
        direction: 'INBOUND',
        preview: 'El client demana disponibilitat per dissabte.',
      },
      link: {
        label: 'Veure entrada',
        href: '/admin/leads/lead-1',
      },
    });
  });

  it('projecta contracte signat com event de negoci amb link al PDF', () => {
    const events = buildCustomerBusinessTimelineEvents({
      proposals: [{
        id: 'prop-1',
        reference: 'P-001',
        customerId: 'cust-1',
        leadId: 'lead-1',
        bookingId: 'booking-1',
        status: 'ACCEPTED',
        total: 1000,
        createdAt: '2026-04-10T10:00:00.000Z',
        acceptedAt: '2026-04-11T10:00:00.000Z',
        contractReference: 'CTR-2026-001',
        contractStatus: 'SIGNED',
        contractPdfUrl: 'https://cdn.test/contracte.pdf',
        contractSignedAt: '2026-04-12T10:00:00.000Z',
      }],
      bookings: [],
      tasks: [],
      messages: [],
    });

    expect(events.find((event) => event.id === 'proposal:prop-1:contract-signed')).toMatchObject({
      type: 'ACTIVITY',
      title: 'Contracte signat (CTR-2026-001)',
      link: {
        label: 'Obrir PDF signat',
        href: 'https://cdn.test/contracte.pdf',
      },
      meta: {
        documentType: 'CONTRACT',
        contractReference: 'CTR-2026-001',
      },
      originLinks: [
        { label: 'Client origen', href: '/admin/clientes/cust-1' },
        { label: 'Entrada origen', href: '/admin/leads/lead-1' },
        { label: 'Reserva origen', href: '/admin/bookings/booking-1' },
      ],
    });
  });
});
