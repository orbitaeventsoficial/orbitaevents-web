import { describe, expect, it } from 'vitest';
import { resolveComposeReturnHref } from '@/app/admin/inbox/compose/composeNavigation';

describe('resolveComposeReturnHref', () => {
  it('prioritza Customer Hub quan hi ha customerId', () => {
    expect(resolveComposeReturnHref({ customerId: 'cust-1', leadId: 'lead-1' })).toBe(
      '/admin/clientes/cust-1?tab=comms'
    );
  });

  it('retorna al workspace del lead quan només hi ha leadId', () => {
    expect(resolveComposeReturnHref({ leadId: 'lead-1' })).toBe('/admin/leads/lead-1');
  });

  it('cau a inbox quan no hi ha context', () => {
    expect(resolveComposeReturnHref({})).toBe('/admin/inbox');
  });
});
