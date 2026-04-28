import { describe, expect, it } from 'vitest';

import { buildLeadCommercialBlocker } from '@/lib/customer-hub/leadCommercialBlocker';

describe('buildLeadCommercialBlocker', () => {
  it('prioritza el follow-up urgent quan existeix', () => {
    const result = buildLeadCommercialBlocker({
      status: 'QUOTE_SENT',
      followUp: {
        leadId: 'lead-1',
        customerId: null,
        name: 'Anna',
        email: 'anna@example.com',
        phone: null,
        eventType: 'BODA',
        status: 'QUOTE_SENT',
        preferredLocale: 'ca',
        contactedAt: new Date('2026-04-01T10:00:00.000Z'),
        lastOutboundAt: new Date('2026-04-05T10:00:00.000Z'),
        daysSinceOutbound: 6,
        outboundCount: 2,
        hasInboundAfterOutbound: false,
        urgency: 'URGENT',
        suggestedAction: 'Trucar o enviar WhatsApp',
      },
    });

    expect(result).toMatchObject({
      label: 'Seguiment urgent',
      context: '6d sense resposta',
      tone: 'DANGER',
    });
  });

  it('cau a estat comercial quan no hi ha follow-up pendent', () => {
    const result = buildLeadCommercialBlocker({
      status: 'NEW',
      followUp: null,
    });

    expect(result).toMatchObject({
      label: 'Primera resposta pendent',
      tone: 'WARNING',
    });
  });
});
