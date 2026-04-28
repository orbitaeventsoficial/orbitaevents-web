import { describe, expect, it } from 'vitest';
import { resolveImportedLeadHref } from '@/app/admin/inbox/importNavigation';

describe('resolveImportedLeadHref', () => {
  it('retorna el Customer Hub quan el lead ja te customerId', () => {
    expect(resolveImportedLeadHref({ id: 'lead-1', customerId: 'cust-1' })).toBe(
      '/admin/clientes/cust-1?tab=comms'
    );
  });

  it('retorna el workspace del lead quan encara no hi ha customerId', () => {
    expect(resolveImportedLeadHref({ id: 'lead-1', customerId: null })).toBe('/admin/leads/lead-1');
  });
});
