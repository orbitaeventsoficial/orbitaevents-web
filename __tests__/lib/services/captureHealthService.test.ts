import { describe, it, expect } from 'vitest';
import { generateCaptureHealth, type CaptureHealthInput } from '@/lib/services/captureHealthService';

function makeInput(overrides: Partial<CaptureHealthInput> = {}): CaptureHealthInput {
  return {
    leadsLast7d: 8,
    leadsPrev7d: 7,
    leadsLast30d: 32,
    leadsPrev30d: 30,
    leadsLast90d: 95,
    sourceCounts: [
      { source: 'WEBSITE', count: 40 },
      { source: 'GOOGLE', count: 30 },
      { source: 'INSTAGRAM', count: 15 },
      { source: 'REFERRAL', count: 10 },
    ],
    ...overrides,
  };
}

describe('generateCaptureHealth', () => {
  it('estat DROUGHT quan leadsLast7d === 0', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 0, leadsPrev7d: 5 }));
    expect(report.status).toBe('DROUGHT');
    expect(report.headline).toBe('Captació aturada');
    expect(report.detail).toContain('Cap lead nou en 7 dies');
    expect(report.suggestedAction.label).toBe('Executar pla de captació');
    expect(report.suggestedAction.href).toBe('/admin/manual');
  });

  it('estat FAMINE quan leadsLast7d entre 1 i 2', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 2 }));
    expect(report.status).toBe('FAMINE');
    expect(report.headline).toContain('molt baixa');
    expect(report.suggestedAction.href).toBe('/admin/manual');
  });

  it('estat LOW quan leadsLast7d entre 3 i 5', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 4 }));
    expect(report.status).toBe('LOW');
    expect(report.headline).toContain('Volum baix');
  });

  it('estat HEALTHY quan leadsLast7d entre 6 i 10', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 8 }));
    expect(report.status).toBe('HEALTHY');
    expect(report.suggestedAction.label).toBe('Optimitzar conversió');
  });

  it('estat GROWING quan leadsLast7d > 10', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 15 }));
    expect(report.status).toBe('GROWING');
    expect(report.suggestedAction.label).toBe('Escalar canals rendibles');
  });

  it('calcula tendència UP quan creix >10%', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 20, leadsPrev7d: 10 }));
    expect(report.trend7d).toBe('UP');
    expect(report.trendPct7d).toBe(100);
  });

  it('calcula tendència DOWN quan cau >10%', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 5, leadsPrev7d: 10 }));
    expect(report.trend7d).toBe('DOWN');
    expect(report.trendPct7d).toBe(-50);
  });

  it('tendència FLAT dins de ±10%', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 10, leadsPrev7d: 10 }));
    expect(report.trend7d).toBe('FLAT');
  });

  it('tendència FLAT quan tots dos són 0', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 0, leadsPrev7d: 0 }));
    expect(report.trend7d).toBe('FLAT');
    expect(report.trendPct7d).toBe(0);
  });

  it('tendència UP 100% quan previous era 0 i ara n\'hi ha', () => {
    const report = generateCaptureHealth(makeInput({ leadsLast7d: 3, leadsPrev7d: 0 }));
    expect(report.trend7d).toBe('UP');
    expect(report.trendPct7d).toBe(100);
  });

  it('ordena sources per count descendent', () => {
    const report = generateCaptureHealth(makeInput({
      sourceCounts: [
        { source: 'WHATSAPP', count: 5 },
        { source: 'WEBSITE', count: 20 },
        { source: 'INSTAGRAM', count: 10 },
      ],
    }));
    expect(report.sources[0].source).toBe('WEBSITE');
    expect(report.sources[1].source).toBe('INSTAGRAM');
    expect(report.sources[2].source).toBe('WHATSAPP');
    expect(report.primarySource).toBe('WEBSITE');
  });

  it('exclou sources amb count 0', () => {
    const report = generateCaptureHealth(makeInput({
      sourceCounts: [
        { source: 'WEBSITE', count: 10 },
        { source: 'PHONE', count: 0 },
        { source: 'WHATSAPP', count: 5 },
      ],
    }));
    expect(report.sources).toHaveLength(2);
    expect(report.sources.find((s) => s.source === 'PHONE')).toBeUndefined();
  });

  it('calcula percentatge correcte per source', () => {
    const report = generateCaptureHealth(makeInput({
      sourceCounts: [
        { source: 'WEBSITE', count: 75 },
        { source: 'INSTAGRAM', count: 25 },
      ],
    }));
    expect(report.sources[0].percentage).toBe(75);
    expect(report.sources[1].percentage).toBe(25);
  });

  it('primarySource és null quan no hi ha sources', () => {
    const report = generateCaptureHealth(makeInput({ sourceCounts: [] }));
    expect(report.primarySource).toBeNull();
    expect(report.sources).toHaveLength(0);
  });

  it('etiqueta source traduïda al català', () => {
    const report = generateCaptureHealth(makeInput({
      sourceCounts: [{ source: 'REFERRAL', count: 10 }],
    }));
    expect(report.sources[0].label).toBe('Referit');
  });

  it('suggested action contextual quan GROWING amb primary source', () => {
    const report = generateCaptureHealth(makeInput({
      leadsLast7d: 15,
      sourceCounts: [{ source: 'GOOGLE', count: 30 }],
    }));
    expect(report.suggestedAction.detail).toContain('Google');
  });
});
