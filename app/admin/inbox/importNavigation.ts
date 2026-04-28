import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';

type ImportedLeadNavigationTarget = {
  id: string;
  customerId?: string | null;
};

export function resolveImportedLeadHref(target: ImportedLeadNavigationTarget): string {
  return buildLeadCustomerHref({
    leadId: target.id,
    customerId: target.customerId,
    customerTab: 'comms',
  });
}
