import { describe, expect, it } from 'vitest';
import {
  rankProposalBookingConversionSuggestions,
  type ProposalBookingConversionInput,
} from '@/lib/services/proposalBookingConversionSuggestionService';

const NOW = new Date('2026-07-09T10:00:00Z');

function proposal(overrides: Partial<ProposalBookingConversionInput> & { id: string; reference?: string }): ProposalBookingConversionInput {
  return {
    id: overrides.id,
    reference: overrides.reference ?? `PROP-${overrides.id}`,
    customerId: Object.prototype.hasOwnProperty.call(overrides, 'customerId') ? overrides.customerId ?? null : 'cust-1',
    leadId: overrides.leadId ?? 'lead-1',
    bookingId: Object.prototype.hasOwnProperty.call(overrides, 'bookingId') ? overrides.bookingId ?? null : null,
    status: overrides.status ?? 'ACCEPTED',
    total: overrides.total ?? 900,
    acceptedAt: Object.prototype.hasOwnProperty.call(overrides, 'acceptedAt') ? overrides.acceptedAt ?? null : new Date('2026-07-07T10:00:00Z'),
    createdAt: overrides.createdAt ?? new Date('2026-07-01T10:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-07-08T10:00:00Z'),
    sentAt: Object.prototype.hasOwnProperty.call(overrides, 'sentAt') ? overrides.sentAt ?? null : new Date('2026-07-06T10:00:00Z'),
    pdfUrl: Object.prototype.hasOwnProperty.call(overrides, 'pdfUrl') ? overrides.pdfUrl ?? null : '/api/uploads/prop.pdf',
    pdfKey: Object.prototype.hasOwnProperty.call(overrides, 'pdfKey') ? overrides.pdfKey ?? null : 'proposals/prop.pdf',
    customer: Object.prototype.hasOwnProperty.call(overrides, 'customer') ? overrides.customer ?? null : { name: 'Anna' },
    lead: Object.prototype.hasOwnProperty.call(overrides, 'lead') ? overrides.lead ?? null : { name: 'Anna lead', eventDate: new Date('2026-07-17T20:30:00Z') },
  };
}

describe('rankProposalBookingConversionSuggestions', () => {
  it('exclou propostes no acceptades, sense client, amb reserva o sense artefacte canònic', () => {
    const suggestions = rankProposalBookingConversionSuggestions([
      proposal({ id: 'draft', status: 'DRAFT' }),
      proposal({ id: 'no-customer', customerId: null }),
      proposal({ id: 'has-booking', bookingId: 'book-1' }),
      proposal({ id: 'no-sent-at', sentAt: null }),
      proposal({ id: 'no-pdf-url', pdfUrl: null }),
      proposal({ id: 'no-pdf-key', pdfKey: null }),
      proposal({ id: 'candidate' }),
    ], 10, NOW);

    expect(suggestions.map((item) => item.proposalId)).toEqual(['candidate']);
  });

  it('obre la creació de reserva amb proposalId i leadId', () => {
    const [suggestion] = rankProposalBookingConversionSuggestions([
      proposal({
        id: 'accepted',
        reference: 'PROP-2026-0042',
        leadId: 'lead-42',
        total: 1200,
      }),
    ], 1, NOW);

    expect(suggestion).toMatchObject({
      proposalId: 'accepted',
      reference: 'PROP-2026-0042',
      customerId: 'cust-1',
      leadId: 'lead-42',
      name: 'Anna',
      band: 'ALTA',
      href: '/admin/bookings/new?proposalId=accepted&leadId=lead-42&prefill=lead',
      daysUntilEvent: 8,
      daysSinceAccepted: 2,
    });
    expect(suggestion.reasons).toContain('Pressupost acceptat');
    expect(suggestion.reasons).toContain('Reserva pendent de crear');
    expect(suggestion.reasons).toContain('Data propera');
  });

  it('prioritza data propera per sobre de valor antic sense data', () => {
    const suggestions = rankProposalBookingConversionSuggestions([
      proposal({
        id: 'old',
        reference: 'PROP-OLD',
        total: 1500,
        acceptedAt: new Date('2026-07-01T10:00:00Z'),
        lead: null,
      }),
      proposal({
        id: 'soon',
        reference: 'PROP-SOON',
        total: 500,
        acceptedAt: new Date('2026-07-09T08:00:00Z'),
        lead: { name: 'Laia', eventDate: new Date('2026-07-11T20:00:00Z') },
      }),
    ], 2, NOW);

    expect(suggestions.map((item) => item.proposalId)).toEqual(['soon', 'old']);
    expect(suggestions[0]).toMatchObject({ band: 'ALTA', daysUntilEvent: 2 });
  });

  it('no recomana una acceptada amb data de bolo passada', () => {
    const suggestions = rankProposalBookingConversionSuggestions([
      proposal({ id: 'past', lead: { name: 'Past', eventDate: new Date('2026-07-01T20:00:00Z') } }),
      proposal({ id: 'future', lead: { name: 'Future', eventDate: new Date('2026-07-30T20:00:00Z') } }),
    ], 10, NOW);

    expect(suggestions.map((item) => item.proposalId)).toEqual(['future']);
  });
});
