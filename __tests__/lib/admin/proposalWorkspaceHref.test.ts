import { describe, expect, it } from 'vitest';
import { buildProposalBookingCreateHref, buildProposalHref } from '@/lib/admin/proposalWorkspaceHref';

describe('buildProposalHref', () => {
  it('construeix la ruta de fitxa pressupost', () => {
    expect(buildProposalHref('proposal-123')).toBe('/admin/presupuestos/proposal-123');
  });
});

describe('buildProposalBookingCreateHref', () => {
  it('crea reserva des de proposta i lead amb prefill explícit', () => {
    expect(buildProposalBookingCreateHref({ proposalId: 'prop-1', leadId: 'lead-1', customerId: 'cust-1' })).toBe(
      '/admin/bookings/new?proposalId=prop-1&leadId=lead-1&prefill=lead',
    );
  });

  it('cau a customerId quan la proposta no té lead', () => {
    expect(buildProposalBookingCreateHref({ proposalId: 'prop-1', customerId: 'cust-1' })).toBe(
      '/admin/bookings/new?proposalId=prop-1&customerId=cust-1',
    );
  });
});
