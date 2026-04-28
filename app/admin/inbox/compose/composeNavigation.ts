import { buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';

export function resolveComposeReturnHref(input: {
  customerId?: string | null;
  leadId?: string | null;
}): string {
  if (input.customerId) {
    return buildCustomerWorkspaceTabHref(input.customerId, 'comms');
  }
  if (input.leadId) {
    return buildLeadWorkspaceHref(input.leadId);
  }
  return '/admin/inbox';
}
