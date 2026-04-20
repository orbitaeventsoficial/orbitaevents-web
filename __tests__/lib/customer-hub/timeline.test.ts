import { describe, expect, it } from 'vitest';

import { buildTimeline } from '@/lib/customer-hub/timeline';

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
});
