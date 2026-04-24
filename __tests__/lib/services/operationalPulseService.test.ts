import { describe, it, expect } from 'vitest';
import { generateOperationalPulse, type PulseInput, type PulseLevel } from '@/lib/services/operationalPulseService';

const NOW = new Date('2026-04-10T10:00:00Z');

function makeInput(overrides: Partial<PulseInput> = {}): PulseInput {
  return {
    avgResponseHours: overrides.avgResponseHours ?? 2,
    slaComplianceRate: overrides.slaComplianceRate ?? 95,
    followUpRate: overrides.followUpRate ?? 85,
    pipelineHealthRate: overrides.pipelineHealthRate ?? 90,
    pipelineConversionRate: overrides.pipelineConversionRate ?? 35,
    overdueTasksRate: overrides.overdueTasksRate ?? 3,
    paymentCollectionRate: overrides.paymentCollectionRate ?? 98,
    customerRetentionRate: overrides.customerRetentionRate ?? 75,
    pipelineDrivers: overrides.pipelineDrivers ?? [],
    now: overrides.now ?? NOW,
  };
}

describe('generateOperationalPulse', () => {
  it('retorna 8 mètriques', () => {
    const result = generateOperationalPulse(makeInput());
    expect(result.metrics).toHaveLength(8);
  });

  it('propaga drivers de pipeline sense inventar resum paral·lel', () => {
    const result = generateOperationalPulse(makeInput({
      pipelineDrivers: [
        {
          type: 'HOT_UNCONTACTED',
          priority: 'CRITICAL',
          title: '2 entrades sense contactar',
          detail: 'La més antiga fa 6h.',
          href: '/admin/leads?status=NEW',
          count: 2,
        },
      ],
    }));

    expect(result.pipelineDrivers).toEqual([
      expect.objectContaining({
        type: 'HOT_UNCONTACTED',
        priority: 'CRITICAL',
        href: '/admin/leads?status=NEW',
      }),
    ]);
  });

  it('overall EXCELLENT quan tot perfecte', () => {
    const result = generateOperationalPulse(makeInput());
    expect(result.overallLevel).toBe('EXCELLENT');
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
  });

  it('responseTime EXCELLENT si < 4h', () => {
    const result = generateOperationalPulse(makeInput({ avgResponseHours: 2 }));
    const m = result.metrics.find((m) => m.key === 'responseTime')!;
    expect(m.level).toBe('EXCELLENT');
    expect(m.value).toBe(2);
  });

  it('responseTime WARNING si 12-24h', () => {
    const result = generateOperationalPulse(makeInput({ avgResponseHours: 18 }));
    const m = result.metrics.find((m) => m.key === 'responseTime')!;
    expect(m.level).toBe('WARNING');
  });

  it('responseTime CRITICAL si > 24h', () => {
    const result = generateOperationalPulse(makeInput({ avgResponseHours: 30 }));
    const m = result.metrics.find((m) => m.key === 'responseTime')!;
    expect(m.level).toBe('CRITICAL');
  });

  it('slaCompliance EXCELLENT si > 90%', () => {
    const result = generateOperationalPulse(makeInput({ slaComplianceRate: 95 }));
    const m = result.metrics.find((m) => m.key === 'slaCompliance')!;
    expect(m.level).toBe('EXCELLENT');
  });

  it('slaCompliance CRITICAL si < 50%', () => {
    const result = generateOperationalPulse(makeInput({ slaComplianceRate: 30 }));
    const m = result.metrics.find((m) => m.key === 'slaCompliance')!;
    expect(m.level).toBe('CRITICAL');
  });

  it('overdueTasks EXCELLENT si < 5%', () => {
    const result = generateOperationalPulse(makeInput({ overdueTasksRate: 3 }));
    const m = result.metrics.find((m) => m.key === 'overdueTasks')!;
    expect(m.level).toBe('EXCELLENT');
  });

  it('overdueTasks CRITICAL si > 30%', () => {
    const result = generateOperationalPulse(makeInput({ overdueTasksRate: 40 }));
    const m = result.metrics.find((m) => m.key === 'overdueTasks')!;
    expect(m.level).toBe('CRITICAL');
  });

  it('overall CRITICAL si 2+ mètriques en CRITICAL', () => {
    const result = generateOperationalPulse(makeInput({
      avgResponseHours: 50,
      slaComplianceRate: 20,
    }));
    expect(result.overallLevel).toBe('CRITICAL');
  });

  it('overall WARNING si 1 CRITICAL o 3+ WARNING', () => {
    const result = generateOperationalPulse(makeInput({
      avgResponseHours: 50, // CRITICAL
    }));
    expect(result.overallLevel).toBe('WARNING');
  });

  it('overall WARNING amb 3 warnings', () => {
    const result = generateOperationalPulse(makeInput({
      avgResponseHours: 18, // WARNING
      slaComplianceRate: 55, // WARNING
      followUpRate: 45, // WARNING
    }));
    expect(result.overallLevel).toBe('WARNING');
  });

  it('overallScore és mitjana de tots els nivells', () => {
    const result = generateOperationalPulse(makeInput());
    // All EXCELLENT → 100 each → avg 100
    expect(result.overallScore).toBe(100);
  });

  it('pipelineHealth GOOD si està entre 70-85%', () => {
    const result = generateOperationalPulse(makeInput({ pipelineHealthRate: 75 }));
    const m = result.metrics.find((m) => m.key === 'pipelineHealth')!;
    expect(m.level).toBe('GOOD');
  });

  it('pipelineConversion GOOD si 20-30%', () => {
    const result = generateOperationalPulse(makeInput({ pipelineConversionRate: 25 }));
    const m = result.metrics.find((m) => m.key === 'pipelineConversion')!;
    expect(m.level).toBe('GOOD');
  });

  it('retention WARNING si 30-50%', () => {
    const result = generateOperationalPulse(makeInput({ customerRetentionRate: 40 }));
    const m = result.metrics.find((m) => m.key === 'retention')!;
    expect(m.level).toBe('WARNING');
  });

  it('generatedAt conté la data', () => {
    const result = generateOperationalPulse(makeInput());
    expect(result.generatedAt).toContain('2026-04-10');
  });

  it('cada mètrica té target definit', () => {
    const result = generateOperationalPulse(makeInput());
    for (const m of result.metrics) {
      expect(m.target).toBeTruthy();
    }
  });

  it('followUpRate 0 (wrapper ha de clampejar negatius) → CRITICAL sense valor negatiu', () => {
    const result = generateOperationalPulse(makeInput({ followUpRate: 0 }));
    const m = result.metrics.find((m) => m.key === 'followUp')!;
    expect(m.level).toBe('CRITICAL');
    expect(m.value).toBe(0);
  });

  it('pipelineHealthRate 0 (wrapper ha de clampejar negatius) → CRITICAL sense valor negatiu', () => {
    const result = generateOperationalPulse(makeInput({ pipelineHealthRate: 0 }));
    const m = result.metrics.find((m) => m.key === 'pipelineHealth')!;
    expect(m.level).toBe('CRITICAL');
    expect(m.value).toBe(0);
  });
});
