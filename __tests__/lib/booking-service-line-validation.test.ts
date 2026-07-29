import { describe, expect, it } from 'vitest';
import { collaboratorLineCostErrorMessage, findCollaboratorLinesWithoutCost } from '@/lib/booking-service-line-validation';

describe('booking-service-line-validation', () => {
  it('permet línies internes sense cost explícit', () => {
    expect(findCollaboratorLinesWithoutCost([
      { label: 'DJ Òrbita', costAmount: null },
    ])).toEqual([]);
  });

  it('marca línies de col·laborador amb cost buit o zero', () => {
    const issues = findCollaboratorLinesWithoutCost([
      { collaboratorId: 'partner-1', label: 'Animació', revenueAmount: 240 },
      { collaboratorId: 'partner-2', label: 'So', costAmount: 0 },
      { collaboratorId: 'partner-3', label: 'Pintacares', costAmount: 160 },
    ]);

    expect(issues).toEqual([
      { index: 0, label: 'Animació' },
      { index: 1, label: 'So' },
    ]);
    expect(collaboratorLineCostErrorMessage(issues[0])).toContain('cost real');
  });

  it('permet tècnic inclòs amb cost negatiu perquè és ingrés d’Òrbita', () => {
    expect(findCollaboratorLinesWithoutCost([
      { collaboratorId: 'partner-1', kind: 'SOUND_TECH', label: 'Tècnic de so inclòs', costAmount: -40 },
    ])).toEqual([]);
  });
});
