import { describe, expect, it } from 'vitest';

import { buildLeadActionLink } from '@/lib/customer-hub/leadActionLink';
import type { LeadDTO } from '@/lib/customer-hub/dto';

function makeLead(overrides: Partial<LeadDTO> = {}): LeadDTO {
  return {
    id: 'lead-1',
    name: 'Anna',
    email: 'anna@example.com',
    phone: '+34 600 112 233',
    eventType: 'BODA',
    status: 'QUOTE_SENT',
    priority: 'HIGH',
    createdAt: '2026-04-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('buildLeadActionLink', () => {
  it('resol WhatsApp per seguiment urgent amb telèfon', () => {
    const result = buildLeadActionLink(
      makeLead({
        commercialBlocker: { label: 'Seguiment urgent', context: '6d sense resposta', tone: 'DANGER' },
      })
    );

    expect(result?.label).toBe('Desencallar per WhatsApp');
    expect(result?.href).toContain('https://wa.me/34600112233?text=');
    expect(result?.external).toBe(true);
  });

  it('resol recordatori email per pressupost pendent', () => {
    const result = buildLeadActionLink(
      makeLead({
        commercialBlocker: { label: 'Pressupost pendent', context: 'Cal desencallar', tone: 'WARNING' },
      })
    );

    expect(result).toEqual({
      href: '/admin/inbox/compose?leadId=lead-1&template=recordatori',
      label: 'Enviar recordatori',
    });
  });
});
