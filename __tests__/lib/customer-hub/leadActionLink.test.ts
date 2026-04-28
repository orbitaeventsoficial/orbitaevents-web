import { describe, expect, it } from 'vitest';

import { buildLeadActionLink } from '@/lib/customer-hub/leadActionLink';
import type { LeadDTO } from '@/lib/customer-hub/dto';

function makeLead(overrides: Partial<LeadDTO> = {}): LeadDTO {
  return {
    id: 'lead-1',
    customerId: 'cust-1',
    name: 'Anna',
    email: 'anna@example.com',
    phone: '+34 600 11 22 33',
    eventType: 'BODA',
    status: 'QUOTE_SENT',
    priority: 'HIGH',
    createdAt: '2026-04-10T10:00:00.000Z',
    commercialBlocker: {
      label: 'Pressupost pendent',
      tone: 'WARNING',
    },
    ...overrides,
  };
}

describe('buildLeadActionLink', () => {
  it('usa compose de client per recordatoris quan hi ha customerId', () => {
    expect(buildLeadActionLink(makeLead())).toEqual({
      href: '/admin/inbox/compose?customerId=cust-1&template=recordatori',
      label: 'Enviar recordatori',
    });
  });

  it('envia la conversió al tab de reserves del client quan hi ha customerId', () => {
    expect(
      buildLeadActionLink(
        makeLead({
          commercialBlocker: {
            label: 'Passar a reserva',
            tone: 'WARNING',
          },
        })
      )
    ).toEqual({
      href: '/admin/clientes/cust-1?tab=bookings',
      label: 'Tancar conversió',
    });
  });

  it('cau al workspace del client per defecte quan la lead ja està vinculada', () => {
    expect(
      buildLeadActionLink(
        makeLead({
          commercialBlocker: {
            label: 'Altres passos',
            tone: 'INFO',
          },
        })
      )
    ).toEqual({
      href: '/admin/clientes/cust-1?tab=leads',
      label: 'Obrir lead',
    });
  });
});
