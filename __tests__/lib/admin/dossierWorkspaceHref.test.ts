import { describe, expect, it } from 'vitest';

import {
  buildDossierCompositePdfHref,
  buildDossierGeneratorPreviewHref,
  buildDossierListHref,
  buildDossierPreviewHref,
  buildDossierStoredPreviewHref,
} from '@/lib/admin/dossierWorkspaceHref';

describe('dossierWorkspaceHref', () => {
  it('construeix el llistat de dossiers amb context opcional de lead', () => {
    expect(buildDossierListHref()).toBe('/admin/dossiers');
    expect(buildDossierListHref('lead 1')).toBe('/admin/dossiers?leadId=lead+1');
  });

  it('construeix la preview solidaria amb el generador de dossiers', () => {
    expect(buildDossierListHref('lead 1', 'preview')).toBe('/admin/dossiers?leadId=lead+1&action=preview');
    expect(buildDossierGeneratorPreviewHref('lead 1')).toBe('/admin/dossiers?leadId=lead+1&action=preview');
    expect(buildDossierPreviewHref('lead 1')).toBe('/api/admin/leads/lead%201/dossier-preview');
  });

  it('construeix el PDF compost des del helper canonic', () => {
    expect(buildDossierCompositePdfHref('dos-1')).toBe('/api/admin/dossiers/dos-1/composite');
  });

  it('construeix la preview server d un dossier ja desat', () => {
    expect(buildDossierStoredPreviewHref('dos-1')).toBe('/api/admin/dossiers/dos-1/preview');
  });
});
