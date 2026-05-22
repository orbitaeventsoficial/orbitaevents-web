import { describe, expect, it } from 'vitest';
import { buildLeadOwnerControlSummary, type LeadOwnerControlLead } from '@/lib/services/leadOwnerControlSummaryService';

function lead(overrides: Partial<LeadOwnerControlLead> = {}): LeadOwnerControlLead {
  return {
    status: 'NEW',
    priority: 'MEDIUM',
    createdAt: new Date('2026-05-18T08:00:00.000Z'),
    customerId: null,
    booking: null,
    ...overrides,
  };
}

describe('buildLeadOwnerControlSummary', () => {
  const now = new Date('2026-05-18T12:00:00.000Z');

  it('fa visible la continuïtat amb Fitxa 360 i reserva vinculada', () => {
    const result = buildLeadOwnerControlSummary([
      lead({ customerId: 'cust-1', booking: { id: 'booking-1' }, status: 'WON' }),
      lead({ customerId: 'cust-2', status: 'QUOTE_SENT', priority: 'HIGH' }),
    ], now);

    expect(result.automaticSignals).toContain('2 entrades ja viuen a Fitxa 360');
    expect(result.automaticSignals).toContain('1 entrada ja vinculada a reserva');
    expect(result.automaticSignals).toContain('1 entrada d’alta prioritat');
  });

  it('prioritza respondre entrades fredes abans que altres senyals', () => {
    const result = buildLeadOwnerControlSummary([
      lead({ createdAt: new Date('2026-05-17T08:00:00.000Z') }),
      lead({ status: 'CONTACTED', priority: 'URGENT' }),
    ], now);

    expect(result.manualSignals).toContain('1 entrada fa més de 24h sense tancar');
    expect(result.nextStep).toEqual({
      href: '/admin/leads?status=NEW',
      label: 'Respondre entrades fredes',
      detail: 'El risc principal és deixar refredar oportunitats que ja passen del llindar saludable.',
    });
  });

  it('manté entrada ràpida quan no hi ha tensió visible', () => {
    const result = buildLeadOwnerControlSummary([], now);

    expect(result).toEqual({
      automaticSignals: [],
      manualSignals: [],
      nextStep: {
        href: '/admin/intake',
        label: 'Crear entrada ràpida',
        detail: 'No hi ha tensió crítica a la vista actual.',
      },
    });
  });
});
