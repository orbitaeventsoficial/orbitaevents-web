import { describe, expect, it } from 'vitest';

import {
  buildLeadBookingPrefillHref,
  buildLeadComposeHref,
  buildLeadPaymentsHref,
  buildLeadTaskHref,
  buildLeadWorkspaceHref,
} from '@/lib/admin/leadWorkspaceHref';

describe('leadWorkspaceHref', () => {
  it('resol el workspace base i ancores de lead', () => {
    expect(buildLeadWorkspaceHref('lead-1')).toBe('/admin/leads/lead-1');
    expect(buildLeadWorkspaceHref('lead-1', 'contact')).toBe('/admin/leads/lead-1#contact');
  });

  it('resol el compose de lead amb plantilla opcional', () => {
    expect(buildLeadComposeHref('lead-1')).toBe('/admin/inbox/compose?leadId=lead-1');
    expect(buildLeadComposeHref('lead-1', 'recordatori')).toBe('/admin/inbox/compose?leadId=lead-1&template=recordatori');
  });

  it('resol la nova reserva amb prefill explícit del lead', () => {
    expect(buildLeadBookingPrefillHref('lead-1')).toBe('/admin/bookings/new?leadId=lead-1&prefill=lead');
  });

  it('prioritza booking i customer quan resol cobraments i tasques', () => {
    expect(buildLeadPaymentsHref({ leadId: 'lead-1', bookingId: 'booking-1', customerId: 'customer-1' })).toBe('/admin/bookings/booking-1');
    expect(buildLeadPaymentsHref({ leadId: 'lead-1', customerId: 'customer-1' })).toBe('/admin/bookings?customerId=customer-1');
    expect(buildLeadPaymentsHref({ leadId: 'lead-1' })).toBe('/admin/leads/lead-1');

    expect(buildLeadTaskHref({ leadId: 'lead-1', customerId: 'customer-1' })).toBe('/admin/tasks?customerId=customer-1');
    expect(buildLeadTaskHref({ leadId: 'lead-1' })).toBe('/admin/leads/lead-1');
  });
});
