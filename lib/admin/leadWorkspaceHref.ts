export function buildLeadWorkspaceHref(leadId: string, hash?: string | null): string {
  return hash ? `/admin/leads/${leadId}#${hash}` : `/admin/leads/${leadId}`;
}

export function buildLeadComposeHref(leadId: string, template?: string | null): string {
  const params = new URLSearchParams({ leadId });
  if (template) params.set('template', template);
  return `/admin/inbox/compose?${params.toString()}`;
}

export function buildLeadBookingPrefillHref(leadId: string): string {
  const params = new URLSearchParams({ leadId, prefill: 'lead' });
  return `/admin/bookings/new?${params.toString()}`;
}
