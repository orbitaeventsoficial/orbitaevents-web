import { describe, expect, it } from 'vitest';
import {
  buildDossierDraftHref,
  rankDossierDraftSuggestions,
  type DossierDraftLeadInput,
} from '@/lib/services/dossierDraftSuggestionService';

const NOW = new Date('2026-07-04T10:00:00Z');

function lead(overrides: Partial<DossierDraftLeadInput> & { id: string; name?: string }): DossierDraftLeadInput {
  return {
    id: overrides.id,
    name: overrides.name ?? `Lead ${overrides.id}`,
    status: overrides.status ?? 'CONTACTED',
    priority: overrides.priority ?? 'MEDIUM',
    eventDate: overrides.eventDate ?? new Date('2026-07-20T00:00:00Z'),
    updatedAt: overrides.updatedAt ?? NOW,
    budget: overrides.budget ?? null,
    distanceKm: overrides.distanceKm ?? null,
    serviceLines: overrides.serviceLines ?? [],
    dossiers: overrides.dossiers ?? [],
  };
}

describe('rankDossierDraftSuggestions', () => {
  it('exclou leads tancats i leads que ja tenen dossier actiu', () => {
    const suggestions = rankDossierDraftSuggestions([
      lead({ id: 'won', status: 'WON' }),
      lead({ id: 'lost', status: 'LOST' }),
      lead({ id: 'with-dossier', dossiers: [{ id: 'd1', deletedAt: null }] }),
      lead({ id: 'candidate', serviceLines: [{ id: 'l1' }] }),
    ], 10, NOW);

    expect(suggestions.map((s) => s.leadId)).toEqual(['candidate']);
  });

  it('prioritza un lead qualificat amb bolo configurat i data propera', () => {
    const suggestions = rankDossierDraftSuggestions([
      lead({ id: 'new-empty', status: 'NEW', eventDate: null }),
      lead({
        id: 'hot',
        status: 'NEGOTIATING',
        priority: 'HIGH',
        eventDate: new Date('2026-07-10T00:00:00Z'),
        serviceLines: [{ id: 'l1' }, { id: 'l2' }],
        distanceKm: 42,
      }),
    ], 2, NOW);

    expect(suggestions[0]).toMatchObject({
      leadId: 'hot',
      band: 'ALTA',
      daysUntilEvent: 6,
      serviceLinesCount: 2,
    });
    expect(suggestions[0].reasons).toEqual(expect.arrayContaining([
      'Bolo configurat',
      'Negociació oberta',
      'Data propera',
      'Sense dossier actiu',
    ]));
  });

  it('no recomana leads oberts amb data ja passada', () => {
    const suggestions = rankDossierDraftSuggestions([
      lead({ id: 'past', eventDate: new Date('2026-07-01T00:00:00Z'), serviceLines: [{ id: 'l1' }] }),
      lead({ id: 'future', eventDate: new Date('2026-08-01T00:00:00Z') }),
    ], 10, NOW);

    expect(suggestions.map((s) => s.leadId)).toEqual(['future']);
  });

  it('construeix un href que només obre el generador preomplert', () => {
    expect(buildDossierDraftHref('lead 1')).toBe('/admin/dossiers?leadId=lead+1');
  });

  it('ignora dossiers eliminats i permet tornar a preparar', () => {
    const suggestions = rankDossierDraftSuggestions([
      lead({ id: 'deleted-only', dossiers: [{ id: 'd1', deletedAt: new Date('2026-07-01T00:00:00Z') }] }),
    ], 10, NOW);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].leadId).toBe('deleted-only');
  });
});
