import { describe, it, expect } from 'vitest';
import { generateWeeklyBenchmark, type WeeklyBenchmarkInput } from '@/lib/services/weeklyBenchmarkService';

function makeInput(overrides: Partial<WeeklyBenchmarkInput> = {}): WeeklyBenchmarkInput {
  return {
    leadsThisWeek: 5,
    leadsPrevWeek: 4,
    bookingsThisWeek: 2,
    bookingsPrevWeek: 1,
    revenueThisWeek: 1200,
    revenuePrevWeek: 800,
    wonThisWeek: 2,
    wonPrevWeek: 1,
    lostThisWeek: 1,
    lostPrevWeek: 2,
    tasksCompletedThisWeek: 8,
    tasksCompletedPrevWeek: 6,
    now: new Date('2026-04-14T09:00:00Z'),
    ...overrides,
  };
}

describe('generateWeeklyBenchmark', () => {
  it('retorna 6 mètriques', () => {
    const report = generateWeeklyBenchmark(makeInput());
    expect(report.metrics).toHaveLength(6);
  });

  it('mètrica de leads té valors correctes', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 10, leadsPrevWeek: 5 }));
    const leads = report.metrics.find((m) => m.label === 'Leads nous');
    expect(leads?.current).toBe(10);
    expect(leads?.previous).toBe(5);
  });

  it('veredicte sequera si dues setmanes a 0', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 0, leadsPrevWeek: 0 }));
    expect(report.verdict).toContain('Captació aturada');
  });

  it('veredicte baixada si setmana actual és 0 però anterior no', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 0, leadsPrevWeek: 5 }));
    expect(report.verdict).toContain('Cap lead');
  });

  it('veredicte creixement si >30% pujada', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 10, leadsPrevWeek: 5 }));
    expect(report.verdict).toContain('creixement');
  });

  it('veredicte baixada si cau >30%', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 3, leadsPrevWeek: 10 }));
    expect(report.verdict).toContain('Baixada');
  });

  it('veredicte estable si variació normal', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 5, leadsPrevWeek: 5 }));
    expect(report.verdict).toContain('estable');
  });

  it('weekLabel conté format de dates', () => {
    const report = generateWeeklyBenchmark(makeInput());
    expect(report.weekLabel).toContain('2026');
  });

  it('generatedAt és ISO string', () => {
    const report = generateWeeklyBenchmark(makeInput());
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('mètrica d\'ingressos amb unitat €', () => {
    const report = generateWeeklyBenchmark(makeInput());
    const revenue = report.metrics.find((m) => m.label === 'Ingressos');
    expect(revenue?.unit).toBe('€');
    expect(revenue?.current).toBe(1200);
    expect(revenue?.previous).toBe(800);
  });

  // Regressió: el verdict concatenava `'+' + pctChange(...)`, però pctChange
  // ja retorna el signe (`+30%`, `+∞`). Resultat: "++30%" o "++∞" al correu
  // setmanal. Dos bugs a la mateixa branca.
  it('veredicte de creixement no duplica el signe `+`', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 10, leadsPrevWeek: 5 }));
    expect(report.verdict).not.toContain('++');
    expect(report.verdict).toMatch(/\+\d+%/);
  });

  it('veredicte quan leadsPrevWeek=0 i hi ha leads nous: cap `∞` al correu', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 3, leadsPrevWeek: 0 }));
    expect(report.verdict).not.toContain('∞');
    expect(report.verdict).not.toContain('++');
    expect(report.verdict).toContain('3');
    expect(report.verdict).toMatch(/setmana a 0/);
  });

  it('veredicte de baixada: cap `+` al text (pctChange ja incorpora el signe negatiu)', () => {
    const report = generateWeeklyBenchmark(makeInput({ leadsThisWeek: 3, leadsPrevWeek: 10 }));
    expect(report.verdict).toContain('Baixada');
    expect(report.verdict).toMatch(/-\d+%/);
    expect(report.verdict).not.toContain('++');
  });
});
