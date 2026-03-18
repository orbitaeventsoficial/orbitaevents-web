import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockBuildReport, mockGetProfConfig, mockGetPackAlertsCount, mockGetPackPricingConfig } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findUnique: vi.fn() },
  },
  mockBuildReport: vi.fn(),
  mockGetProfConfig: vi.fn(),
  mockGetPackAlertsCount: vi.fn(),
  mockGetPackPricingConfig: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/profitabilityService', () => ({
  buildProfitabilityReport: mockBuildReport,
  getProfitabilityConfig: mockGetProfConfig,
}));
vi.mock('@/lib/services/packPricingHealth', () => ({
  getPackPricingAlertsCount: mockGetPackAlertsCount,
  getPackPricingModelConfigEditable: mockGetPackPricingConfig,
}));

import { getFinanceAlertsSummary } from '@/lib/services/financeAlertsService';

beforeEach(() => {
  vi.clearAllMocks();
  mockBuildReport.mockResolvedValue({ riskProfitability: [] });
  mockGetProfConfig.mockResolvedValue({
    packCostRatio: 0.3,
    extraCostRatio: 0.2,
    extraHourCostRatio: 0.1,
    fixedOperationalCost: 50,
  });
  mockGetPackAlertsCount.mockResolvedValue(0);
  mockGetPackPricingConfig.mockResolvedValue({
    marginTargetPct: 30,
    operatorCostPerHour: 15,
    specialistCostPerHour: 25,
    alertDivergencePct: 15,
  });
  mockPrisma.setting.findUnique.mockResolvedValue(null);
});

describe('getFinanceAlertsSummary', () => {
  it('retorna ok amb breakdown', async () => {
    mockPrisma.setting.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === 'pricing.pack.marginTargetPct') return { value: '30' };
      return null;
    });

    const result = await getFinanceAlertsSummary();

    expect(result.ok).toBe(true);
    expect(result).toHaveProperty('count');
    expect(result).toHaveProperty('breakdown');
    expect(result.breakdown).toHaveProperty('lowMarginRiskCount');
    expect(result.breakdown).toHaveProperty('packPricingAlertsCount');
  });

  it('incrementa count amb config profitabilitat crítica', async () => {
    mockGetProfConfig.mockResolvedValue({
      packCostRatio: 0,
      extraCostRatio: 0.2,
      extraHourCostRatio: 0.1,
      fixedOperationalCost: 50,
    });
    mockPrisma.setting.findUnique.mockResolvedValue({ value: '30' });

    const result = await getFinanceAlertsSummary();

    expect(result.breakdown.criticalCount).toBeGreaterThanOrEqual(1);
  });

  it('gestiona errors graciosament', async () => {
    mockBuildReport.mockRejectedValue(new Error('fail'));
    mockGetProfConfig.mockRejectedValue(new Error('fail'));
    mockGetPackAlertsCount.mockRejectedValue(new Error('fail'));
    mockGetPackPricingConfig.mockRejectedValue(new Error('fail'));

    const result = await getFinanceAlertsSummary();

    expect(result.ok).toBe(true);
    expect(result.breakdown.lowMarginRiskCount).toBe(1);
  });

  it('compta alertes autofix', async () => {
    mockPrisma.setting.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === 'alerts.finance.autofixFailureCount') return { value: '3' };
      if (where.key === 'alerts.system.autofixFailureCount') return { value: '2' };
      if (where.key === 'pricing.pack.marginTargetPct') return { value: '30' };
      return null;
    });

    const result = await getFinanceAlertsSummary();

    expect(result.breakdown.autofixFailureCount).toBe(3);
    expect(result.breakdown.systemAutofixFailureCount).toBe(2);
  });
});
