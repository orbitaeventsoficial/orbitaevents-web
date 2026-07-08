import { describe, expect, it } from 'vitest';

import { buildDossierCompositePdfHref, buildDossierListHref } from '@/lib/admin/dossierWorkspaceHref';

describe('dossierWorkspaceHref', () => {
  it('construeix el llistat de dossiers amb context opcional de lead', () => {
    expect(buildDossierListHref()).toBe('/admin/dossiers');
    expect(buildDossierListHref('lead 1')).toBe('/admin/dossiers?leadId=lead+1');
  });

  it('construeix el PDF compost des del helper canonic', () => {
    expect(buildDossierCompositePdfHref('dos-1')).toBe('/api/admin/dossiers/dos-1/composite');
  });
});
