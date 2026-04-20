import { describe, it, expect } from 'vitest';
import { generateScoreBreakdown, type ScoreBreakdownInput } from '@/lib/services/leadScoreBreakdownService';

const NOW = new Date('2026-04-10T10:00:00Z');

function makeInput(overrides: Partial<ScoreBreakdownInput> = {}): ScoreBreakdownInput {
  return {
    status: 'NEW',
    createdAt: '2026-04-09T08:00:00Z',
    updatedAt: '2026-04-09T08:00:00Z',
    now: NOW,
    ...overrides,
  };
}

describe('generateScoreBreakdown', () => {
  it('retorna factor BASE per estat', () => {
    const result = generateScoreBreakdown(makeInput());
    const base = result.factors.find((f) => f.type === 'BASE');
    expect(base).toBeDefined();
    expect(base!.label).toContain('Nova');
    expect(base!.points).toBe(20);
  });

  it('estat NEGOTIATING dona base 72', () => {
    const result = generateScoreBreakdown(makeInput({ status: 'NEGOTIATING' }));
    const base = result.factors.find((f) => f.type === 'BASE');
    expect(base!.points).toBe(72);
  });

  it('pressupost alt dona +14', () => {
    const result = generateScoreBreakdown(makeInput({ budget: '3000' }));
    const f = result.factors.find((f) => f.label.includes('Pressupost alt'));
    expect(f).toBeDefined();
    expect(f!.points).toBe(14);
  });

  it('pressupost mitjà dona +8', () => {
    const result = generateScoreBreakdown(makeInput({ budget: '1000' }));
    const f = result.factors.find((f) => f.label.includes('mitjà'));
    expect(f).toBeDefined();
    expect(f!.points).toBe(8);
  });

  it('sense pressupost és NEGATIVE amb 0 punts', () => {
    const result = generateScoreBreakdown(makeInput());
    const f = result.factors.find((f) => f.label === 'Sense pressupost');
    expect(f).toBeDefined();
    expect(f!.type).toBe('NEGATIVE');
    expect(f!.points).toBe(0);
  });

  it('telèfon dona +8', () => {
    const result = generateScoreBreakdown(makeInput({ phone: '+34666' }));
    const f = result.factors.find((f) => f.label.includes('telèfon de contacte'));
    expect(f!.points).toBe(8);
    expect(f!.type).toBe('POSITIVE');
  });

  it('data viable (30d) dona +10', () => {
    const result = generateScoreBreakdown(makeInput({
      eventDate: '2026-05-10T00:00:00Z',
    }));
    const f = result.factors.find((f) => f.label.includes('viable'));
    expect(f).toBeDefined();
    expect(f!.points).toBe(10);
  });

  it('event passat dona -20', () => {
    const result = generateScoreBreakdown(makeInput({
      eventDate: '2026-04-01T00:00:00Z',
    }));
    const f = result.factors.find((f) => f.label.includes('passat'));
    expect(f!.points).toBe(-20);
    expect(f!.type).toBe('NEGATIVE');
  });

  it('lloc definit dona +4', () => {
    const result = generateScoreBreakdown(makeInput({ eventLocation: 'Barcelona' }));
    const f = result.factors.find((f) => f.label.includes('Lloc'));
    expect(f!.points).toBe(4);
  });

  it('convidats ≥40 dona +3', () => {
    const result = generateScoreBreakdown(makeInput({ guestCount: 50 }));
    const f = result.factors.find((f) => f.label.includes('convidats'));
    expect(f!.points).toBe(3);
  });

  it('pack seleccionat dona +4', () => {
    const result = generateScoreBreakdown(makeInput({ interestedPackId: 'pack-1' }));
    const f = result.factors.find((f) => f.label.includes('Pack'));
    expect(f!.points).toBe(4);
  });

  it('source REFERRAL dona +6', () => {
    const result = generateScoreBreakdown(makeInput({ source: 'REFERRAL' }));
    const f = result.factors.find((f) => f.label.includes('referit'));
    expect(f!.points).toBe(6);
  });

  it('sense seguiment >72h penalitza -12', () => {
    const result = generateScoreBreakdown(makeInput({
      updatedAt: '2026-04-06T00:00:00Z', // >72h
    }));
    const f = result.factors.find((f) => f.label.includes('seguiment'));
    expect(f!.type).toBe('NEGATIVE');
    expect(f!.points).toBe(-12);
  });

  it('band LOW quan score < 45', () => {
    const result = generateScoreBreakdown(makeInput({ status: 'NEW' }));
    expect(result.band).toBe('LOW');
  });

  it('band HIGH quan score >= 70', () => {
    const result = generateScoreBreakdown(makeInput({
      status: 'NEGOTIATING',
      phone: '+34666',
      budget: '3000',
    }));
    expect(result.band).toBe('HIGH');
  });

  it('positiveTotal i negativeTotal calculats correctament', () => {
    const result = generateScoreBreakdown(makeInput({
      phone: '+34666', // +8
      budget: '3000', // +14
    }));
    expect(result.positiveTotal).toBeGreaterThanOrEqual(22);
    expect(result.negativeTotal).toBeLessThanOrEqual(0);
  });

  it('score clamped entre 0 i 100', () => {
    // Score molt baix
    const low = generateScoreBreakdown(makeInput({
      status: 'LOST',
      eventDate: '2026-01-01T00:00:00Z', // -20
    }));
    expect(low.score).toBeGreaterThanOrEqual(0);

    // Score molt alt
    const high = generateScoreBreakdown(makeInput({
      status: 'WON',
      budget: '5000',
      phone: '+34666',
      eventDate: '2026-05-10T00:00:00Z',
      eventLocation: 'Barcelona',
      guestCount: 100,
      interestedPackId: 'p1',
      source: 'REFERRAL',
    }));
    expect(high.score).toBeLessThanOrEqual(100);
  });

  it('probability derivada del score i estat', () => {
    const result = generateScoreBreakdown(makeInput({ status: 'QUOTE_SENT' }));
    expect(result.probability).toBeGreaterThan(0);
    expect(result.probability).toBeLessThan(1);
  });
});
