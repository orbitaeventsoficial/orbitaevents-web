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
});
