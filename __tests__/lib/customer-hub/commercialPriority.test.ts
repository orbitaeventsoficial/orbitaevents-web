import { describe, expect, it } from 'vitest';

import { buildCustomerCommercialPriority } from '@/lib/customer-hub/commercialPriority';
import type { CustomerInsightsDTO } from '@/lib/customer-hub/dto';

const BASE_INSIGHTS: CustomerInsightsDTO = {
  nextAction: {
    type: 'NONE',
    label: 'Cap acció pendent',
    urgency: 'LOW',
  },
  commercialRisk: {
    level: 'NONE',
    label: 'Sense risc comercial actiu',
  },
  relationalHealth: 'GOOD',
  ltv: 0,
  recurrence: 0,
  completedEvents: 0,
  daysSinceLastContact: null,
  daysSinceLastEvent: null,
  daysUntilNextEvent: null,
  openTasksCount: 0,
  pendingPaymentTotal: 0,
};

describe('buildCustomerCommercialPriority', () => {
  it('prioritza risc comercial alt amb top follow-up visible', () => {
    const result = buildCustomerCommercialPriority({
      insights: {
        ...BASE_INSIGHTS,
        commercialRisk: {
          level: 'HIGH',
          label: 'Risc comercial alt',
          context: '2 seguiments urgents sense resposta',
        },
      },
      followUpSummary: {
        total: 2,
        urgent: 2,
        normal: 0,
        low: 0,
        topItem: {
          leadId: 'lead-1',
          name: 'Anna',
          phone: null,
          urgency: 'URGENT',
          daysSinceOutbound: 6,
          suggestedAction: 'Trucar o enviar WhatsApp',
        },
      },
    });

    expect(result).toEqual({
      title: 'Prioritat comercial alta',
      detail: '2 seguiments urgents sense resposta',
      footnote: 'Anna · 6d sense resposta',
    });
  });

  it('cau al pròxim pas comercial si no hi ha risc però sí següent acció de seguiment', () => {
    const result = buildCustomerCommercialPriority({
      insights: {
        ...BASE_INSIGHTS,
        nextAction: {
          type: 'FOLLOW_UP',
          label: 'Respondre al client',
          urgency: 'HIGH',
          context: 'Últim toc entrant per email',
        },
      },
    });

    expect(result).toEqual({
      title: 'Pròxim pas comercial',
      detail: 'Respondre al client',
      footnote: 'Últim toc entrant per email',
    });
  });
});
