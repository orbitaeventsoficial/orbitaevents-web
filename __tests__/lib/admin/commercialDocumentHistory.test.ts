import { describe, expect, it } from 'vitest';

import { getDossierHistoryKindLabel, getLeadDocumentHistoryMeta } from '@/lib/admin/commercialDocumentHistory';

describe('commercialDocumentHistory', () => {
  it('no etiqueta dossiers legacy quote com a pressupost canònic', () => {
    expect(getDossierHistoryKindLabel('quote')).toBe('Dossier comercial històric');
    expect(getDossierHistoryKindLabel('DRAFT')).toBe('Dossier');
    expect(getDossierHistoryKindLabel(null)).toBe('Dossier');
  });

  it('presenta LeadDocument QUOTE com a traça retirada sense enllaç', () => {
    expect(getLeadDocumentHistoryMeta('QUOTE', 'quote-email:PRE-2026-8JZG')).toEqual({
      kindLabel: 'Traça legacy retirada',
      statusLabel: 'RETIRAT',
      href: null,
      targetBlank: false,
    });
  });
});
