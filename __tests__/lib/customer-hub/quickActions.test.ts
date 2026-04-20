import { describe, expect, it } from 'vitest';

import { dedupeCustomerHubQuickActions } from '@/lib/customer-hub/quickActions';

describe('dedupeCustomerHubQuickActions', () => {
  it('elimina quick actions duplicades per href i label', () => {
    const result = dedupeCustomerHubQuickActions([
      { href: '/admin/inbox/compose?customerId=c1&template=recordatori', label: 'Enviar recordatori', color: 'amber' },
      { href: '/admin/inbox/compose?customerId=c1&template=recordatori', label: 'Enviar recordatori', color: 'cyan' },
      { href: '/admin/inbox/compose?customerId=c1', label: 'Enviar missatge', color: 'slate' },
    ]);

    expect(result).toEqual([
      { href: '/admin/inbox/compose?customerId=c1&template=recordatori', label: 'Enviar recordatori', color: 'amber' },
      { href: '/admin/inbox/compose?customerId=c1', label: 'Enviar missatge', color: 'slate' },
    ]);
  });
});
