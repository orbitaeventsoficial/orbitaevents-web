export function buildProposalHref(proposalId: string): string {
  return `/admin/presupuestos/${proposalId}`;
}

export function buildProposalBookingCreateHref(input: {
  proposalId: string;
  leadId?: string | null;
  customerId?: string | null;
}): string {
  const params = new URLSearchParams({ proposalId: input.proposalId });
  if (input.leadId) {
    params.set('leadId', input.leadId);
    params.set('prefill', 'lead');
  } else if (input.customerId) {
    params.set('customerId', input.customerId);
  }
  return `/admin/bookings/new?${params.toString()}`;
}
