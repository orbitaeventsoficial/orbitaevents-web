import { buildCustomerBookingListHref, buildCustomerTaskListHref } from './customerWorkspaceHref';
import { buildBookingHref } from './bookingWorkspaceHref';

export function buildLeadWorkspaceHref(leadId: string, hash?: string | null): string {
  return hash ? `/admin/leads/${leadId}#${hash}` : `/admin/leads/${leadId}`;
}

export function buildLeadComposeHref(leadId: string, template?: string | null): string {
  const params = new URLSearchParams({ leadId });
  if (template) params.set('template', template);
  return `/admin/inbox/compose?${params.toString()}`;
}

export function buildLeadPaymentsHref(input: {
  leadId: string;
  customerId?: string | null;
  bookingId?: string | null;
}): string {
  if (input.bookingId) return buildBookingHref(input.bookingId);
  if (input.customerId) return buildCustomerBookingListHref(input.customerId);
  return buildLeadWorkspaceHref(input.leadId);
}

export function buildLeadTaskHref(input: {
  leadId: string;
  customerId?: string | null;
}): string {
  if (input.customerId) return buildCustomerTaskListHref(input.customerId);
  return buildLeadWorkspaceHref(input.leadId);
}
