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

export function buildLeadCustomerContinuityTarget(input: {
  leadId: string;
  customerId?: string | null;
}): { href: string; label: string; title: string } {
  if (input.customerId) {
    return {
      href: buildLeadCustomerHref({
        leadId: input.leadId,
        customerId: input.customerId,
        customerTab: 'leads',
      }),
      label: 'Fitxa 360',
      title: 'Obrir Fitxa 360 del client',
    };
  }

  return {
    href: buildLeadWorkspaceHref(input.leadId),
    label: 'Fitxa lead',
    title: 'Obrir fitxa del lead',
  };
}
