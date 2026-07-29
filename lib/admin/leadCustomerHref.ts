import {
  buildCustomerWorkspaceTabHref,
  type CustomerWorkspaceTab,
} from '@/lib/admin/customerWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';

export function buildLeadCustomerHref(input: {
  leadId: string;
  customerId?: string | null;
  customerTab?: CustomerWorkspaceTab;
}): string {
  if (input.customerId) {
    return buildCustomerWorkspaceTabHref(input.customerId, input.customerTab || 'comms');
  }
  return buildLeadWorkspaceHref(input.leadId);
}
