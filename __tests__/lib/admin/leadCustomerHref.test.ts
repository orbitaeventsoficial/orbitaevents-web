import { describe, expect, it } from 'vitest';
import { buildLeadCustomerContinuityTarget, buildLeadCustomerHref } from '@/lib/admin/leadCustomerHref';

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

  it('construeix el CTA de continuïtat cap a Fitxa 360 quan el lead ja és client', () => {
    expect(buildLeadCustomerContinuityTarget({ leadId: 'lead-1', customerId: 'cust-1' })).toEqual({
      href: '/admin/clientes/cust-1?tab=leads',
      label: 'Fitxa 360',
      title: 'Obrir Fitxa 360 del client',
    });
  });

  it('manté la fitxa de lead com a CTA quan encara no hi ha client', () => {
    const target = buildLeadCustomerContinuityTarget({ leadId: 'lead-1', customerId: null });

    expect(target).toMatchObject({
      label: 'Fitxa lead',
      title: 'Obrir fitxa del lead',
    });
    expect(target.href).toContain('/admin/leads/lead-1');
  });
});
