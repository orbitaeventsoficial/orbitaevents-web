import { describe, expect, it } from 'vitest';
import { buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';

describe('buildLeadCustomerHref', () => {
  it('retorna la URL del hub de client quan hi ha customerId (tab per defecte comms)', () => {
    expect(buildLeadCustomerHref({ leadId: 'lead-1', customerId: 'cust-1' })).toBe(
      '/admin/clientes/cust-1?tab=comms',
    );
  });

  it('usa la customerTab especificada quan es passa', () => {
    expect(
      buildLeadCustomerHref({ leadId: 'lead-1', customerId: 'cust-1', customerTab: 'summary' }),
    ).toBe('/admin/clientes/cust-1?tab=summary');
  });

  it('retorna la URL del workspace de lead quan no hi ha customerId', () => {
    const href = buildLeadCustomerHref({ leadId: 'lead-42' });
    expect(href).toContain('lead-42');
    expect(href).not.toContain('clientes');
  });

  it('tracta customerId null com a absent i retorna URL de lead', () => {
    const href = buildLeadCustomerHref({ leadId: 'lead-7', customerId: null });
    expect(href).toContain('lead-7');
    expect(href).not.toContain('clientes');
  });

});
