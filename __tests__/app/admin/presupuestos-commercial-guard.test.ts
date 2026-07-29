import { describe, expect, it } from 'vitest';

import { buildProposalCommercialGuard } from '@/app/admin/presupuestos/commercial-guard';

describe('buildProposalCommercialGuard', () => {
  it('degrada a pendent si encara no hi ha lectura economica', () => {
    const result = buildProposalCommercialGuard(null);

    expect(result.tone).toBe('unknown');
    expect(result.label).toBe('Marge pendent');
    expect(result.facts).toEqual([]);
  });

  it('marca risc alt quan el marge es rose', () => {
    const result = buildProposalCommercialGuard({
      directCost: 920,
      netMargin: 80,
      marginPct: 8,
      acquisitionCost: 35,
      marginTone: { tone: 'rose', label: 'Critic' },
    });

    expect(result.tone).toBe('danger');
    expect(result.label).toBe('Risc alt abans d\'enviar');
    expect(result.detail).toContain('8.0%');
    expect(result.facts.map((fact) => fact.label)).toEqual(['Cost directe', 'Marge net', 'CAC estimat']);
  });

  it('agrupa amber i orange com a vigilancia abans d enviar', () => {
    for (const tone of ['amber', 'orange'] as const) {
      const result = buildProposalCommercialGuard({
        directCost: 500,
        netMargin: 250,
        marginPct: 33.33,
        marginTone: { tone, label: 'Correcte' },
      });

      expect(result.tone).toBe('watch');
      expect(result.label).toBe('Vigila abans d\'enviar');
    }
  });

  it('marca marge sa quan el marge es emerald', () => {
    const result = buildProposalCommercialGuard({
      directCost: 300,
      netMargin: 700,
      marginPct: 70,
      acquisitionCost: 12,
      marginTone: { tone: 'emerald', label: 'Excel.lent' },
    });

    expect(result.tone).toBe('ok');
    expect(result.label).toBe('Marge sa per enviar');
    expect(result.facts.find((fact) => fact.label === 'CAC estimat')?.value).toContain('12');
  });
});
