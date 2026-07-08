import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('DossierGeneratorClient customer lookup guard', () => {
  const source = readFileSync(join(process.cwd(), 'app/admin/dossiers/DossierGeneratorClient.tsx'), 'utf8');

  it('no tracta una fallada de clients com a zero coincidencies', () => {
    expect(source).toContain('const CUSTOMER_LOOKUP_ERROR =');
    expect(source).toContain('throw new Error(payload.error || payload.message || CUSTOMER_LOOKUP_ERROR);');
    expect(source).toContain("setCustomerSearchError(err instanceof Error ? err.message : CUSTOMER_LOOKUP_ERROR);");
    expect(source).toContain("toast.error(err instanceof Error ? err.message : 'Error desant el dossier');");
    expect(source).toContain('customerSearchError && (');
    expect(source).not.toContain('if (!res.ok) return [];');
  });

  it('avisa si no pot importar productes del lead', () => {
    const start = source.indexOf('const syncProductsFromLead');
    const end = source.indexOf('const syncProductsToLead');
    const syncBlock = source.slice(start, end);

    expect(source).toContain('const LEAD_PRODUCTS_SYNC_ERROR =');
    expect(syncBlock).toContain('throw new Error(data.error || data.message || LEAD_PRODUCTS_SYNC_ERROR);');
    expect(syncBlock).toContain('setLeadSyncError(message);');
    expect(syncBlock).toContain('toast.error(message);');
    expect(source).toContain('leadSyncError && (');
    expect(syncBlock).not.toContain('if (!res.ok) return;');
  });

  it('avisa si no pot cercar leads existents', () => {
    const start = source.indexOf('const searchLeads');
    const end = source.indexOf('const loadCustomers');
    const searchBlock = source.slice(start, end);

    expect(source).toContain('const LEAD_LOOKUP_ERROR =');
    expect(searchBlock).toContain('throw new Error(data.error || data.message || LEAD_LOOKUP_ERROR);');
    expect(searchBlock).toContain('setLeadSearchError(err instanceof Error ? err.message : LEAD_LOOKUP_ERROR);');
    expect(source).toContain('leadSearchError && (');
    expect(searchBlock).not.toContain('if (!res.ok) return;');
  });

  it('hereta km i peatges quan es selecciona un lead des del cercador', () => {
    const start = source.indexOf('function selectLead');
    const end = source.indexOf('function selectCustomer');
    const selectBlock = source.slice(start, end);

    expect(source).toContain('distanceKm?: number | null;');
    expect(source).toContain('tollsEur?: number | null;');
    expect(selectBlock).toContain("setTravelKm(lead.distanceKm != null && lead.distanceKm > 0 ? String(lead.distanceKm) : '');");
    expect(selectBlock).toContain("setTravelTollsEur(lead.tollsEur != null && lead.tollsEur > 0 ? String(lead.tollsEur) : '');");
  });
});
