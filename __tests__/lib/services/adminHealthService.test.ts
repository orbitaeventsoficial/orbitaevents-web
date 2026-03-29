import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    setting: { findMany: vi.fn() },
    inventoryItem: { count: vi.fn(), findMany: vi.fn() },
    extra: { count: vi.fn(), findMany: vi.fn() },
    lead: { count: vi.fn() },
    booking: { count: vi.fn(), findMany: vi.fn() },
    task: { count: vi.fn() },
    customer: { count: vi.fn() },
    pack: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/env', () => ({
  isImapConfigured: vi.fn(),
  isSmtpConfigured: vi.fn(),
}));
vi.mock('@/lib/services/financeAlertsService', () => ({
  getFinanceAlertsSummary: vi.fn(),
}));
vi.mock('@/lib/services/packPricingHealth', () => ({
  getPackPricingModelConfigEditable: vi.fn(),
  computePackPricingHealth: vi.fn(),
}));
vi.mock('@/lib/inventory-utils', () => ({
  calculateCostPerHour: vi.fn(),
}));

import { getAdminHealthSnapshot } from '@/lib/services/adminHealthService';
import { isImapConfigured, isSmtpConfigured } from '@/lib/env';
import { getFinanceAlertsSummary } from '@/lib/services/financeAlertsService';
import { computePackPricingHealth, getPackPricingModelConfigEditable } from '@/lib/services/packPricingHealth';
import { calculateCostPerHour } from '@/lib/inventory-utils';

function queueInventoryCounts(...values: number[]) {
  values.forEach((value) => mockPrisma.inventoryItem.count.mockResolvedValueOnce(value));
}

function queueExtraCounts(...values: number[]) {
  values.forEach((value) => mockPrisma.extra.count.mockResolvedValueOnce(value));
}

function queueBookingCounts(...values: number[]) {
  values.forEach((value) => mockPrisma.booking.count.mockResolvedValueOnce(value));
}

describe('adminHealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'emails.cron.lastRun', value: new Date().toISOString() },
      { key: 'automation.commercial.lastRun', value: new Date().toISOString() },
    ]);
    queueInventoryCounts(0, 0, 0, 0);
    mockPrisma.inventoryItem.findMany
      .mockResolvedValueOnce([])   // lowStockRows
      .mockResolvedValueOnce([]);  // lifecycleRows
    queueExtraCounts(0, 0);
    mockPrisma.extra.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);
    queueBookingCounts(0, 0);
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.task.count.mockResolvedValue(0);
    mockPrisma.customer.count.mockResolvedValue(0);
    mockPrisma.pack.findMany.mockResolvedValue([]);

    vi.mocked(isImapConfigured).mockReturnValue(true);
    vi.mocked(isSmtpConfigured).mockReturnValue(true);
    vi.mocked(getFinanceAlertsSummary).mockResolvedValue({
      ok: true,
      count: 0,
      breakdown: {
        lowMarginRiskCount: 0,
        packPricingAlertsCount: 0,
        criticalCount: 0,
        autofixFailureCount: 0,
        systemAutofixFailureCount: 0,
      },
    });
    vi.mocked(getPackPricingModelConfigEditable).mockResolvedValue({
      marginTargetPct: 0.55,
      socialSecurityPct: 0.32,
      withholdingPct: 0.15,
      operatorNetCostPerHour: 16.67,
      specialistNetCostPerHour: 22.5,
      operatorCostPerHour: 22,
      specialistCostPerHour: 29.7,
      specialistServices: ['bodas'],
      supportOperatorMinGuests: 150,
      supportOperatorMinDjHours: 6,
      supportOperatorMinWatts: 6000,
      fixedPackCost: 35,
      alertDivergencePct: 20,
    });
    vi.mocked(computePackPricingHealth).mockImplementation((pack: any) => ({
      packId: pack.id,
      publicPrice: pack.price,
      publicExtraHourPrice: pack.extraHourPrice,
      recommendedPrice: pack.price,
      recommendedExtraHourPrice: pack.extraHourPrice,
      divergencePct: 0,
      extraHourDivergencePct: 0,
      hasAlert: false,
      extraHourAlert: false,
      specialistCount: 1,
      operatorCount: 0,
      laborTier: 'mixed',
      laborCostPerHourUsed: 10,
      laborNetCostPerHourUsed: 10,
      laborNetAfterWithholdingPerHourUsed: 8.5,
      recommendedOperatorExtraHourPrice: 25,
      socialSecurityPct: 0.32,
      withholdingPct: 0.15,
    }));
    vi.mocked(calculateCostPerHour).mockImplementation((price: number | null | undefined, lifeHours: number | null | undefined) => {
      if (!price || !lifeHours) return 0;
      return price / lifeHours;
    });
  });

  it('retorna seccions en verd quan no hi ha incidències obertes', async () => {
    const snapshot = await getAdminHealthSnapshot();

    expect(snapshot.summary.critical).toBe(0);
    expect(snapshot.summary.warning).toBe(0);
    expect(snapshot.summary.ok).toBe(5);
    expect(snapshot.sections).toHaveLength(5);
    expect(snapshot.sections.every((section) => section.items[0]?.status === 'ok')).toBe(true);
  });

  it('marca incidències crítiques i avisos quan detecta problemes reals', async () => {
    const now = new Date();

    mockPrisma.setting.findMany.mockResolvedValue([
      { key: 'emails.cron.lastRun', value: '2026-01-01T00:00:00.000Z' },
      { key: 'automation.commercial.lastRun', value: '2026-01-01T00:00:00.000Z' },
      { key: 'alerts.finance.autofixFailureCount', value: '2' },
      { key: 'alerts.system.autofixFailureCount', value: '1' },
    ]);
    mockPrisma.inventoryItem.count.mockReset();
    queueInventoryCounts(3, 4, 2, 0);
    mockPrisma.inventoryItem.findMany.mockReset();
    mockPrisma.inventoryItem.findMany
      .mockResolvedValueOnce([{ id: 'inv-1', stockQuantity: 1, minStock: 2 }])  // lowStockRows
      .mockResolvedValueOnce([]);  // lifecycleRows
    mockPrisma.extra.count.mockReset();
    queueExtraCounts(2, 1);
    mockPrisma.extra.findMany.mockResolvedValue([
      { id: 'extra-1', slug: 'fum', price: 40, costPerUnit: 32 },
      { id: 'extra-2', slug: 'confeti', price: 0, costPerUnit: 10 },
    ]);
    mockPrisma.lead.count.mockResolvedValue(5);
    mockPrisma.booking.count.mockReset();
    queueBookingCounts(6, 1);
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'booking-overdue-deposit',
        eventDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        depositPaid: false,
        remainingPaid: false,
      },
      {
        id: 'booking-overdue-remaining',
        eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        depositPaid: true,
        remainingPaid: false,
      },
      {
        id: 'booking-due-soon',
        eventDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
        depositPaid: false,
        remainingPaid: false,
      },
    ]);
    mockPrisma.task.count.mockResolvedValue(7);
    mockPrisma.customer.count.mockResolvedValue(3);
    vi.mocked(isImapConfigured).mockReturnValue(false);
    vi.mocked(isSmtpConfigured).mockReturnValue(false);
    vi.mocked(getFinanceAlertsSummary).mockResolvedValue({
      ok: true,
      count: 6,
      breakdown: {
        lowMarginRiskCount: 2,
        packPricingAlertsCount: 1,
        criticalCount: 1,
        autofixFailureCount: 2,
        systemAutofixFailureCount: 1,
      },
    });
    vi.mocked(computePackPricingHealth).mockImplementation((pack: any) => ({
      packId: pack.id,
      publicPrice: pack.price,
      publicExtraHourPrice: pack.extraHourPrice,
      recommendedPrice: pack.id === 'pack-2' ? 140 : 95,
      recommendedExtraHourPrice: pack.id === 'pack-2' ? 60 : 30,
      divergencePct: pack.id === 'pack-2' ? -28 : -5,
      extraHourDivergencePct: pack.id === 'pack-2' ? -35 : 0,
      hasAlert: pack.id === 'pack-2',
      extraHourAlert: pack.id === 'pack-2',
      specialistCount: 1,
      operatorCount: 0,
      laborTier: 'mixed',
      laborCostPerHourUsed: pack.id === 'pack-2' ? 24 : 12,
      laborNetCostPerHourUsed: pack.id === 'pack-2' ? 20 : 10,
      laborNetAfterWithholdingPerHourUsed: 8.5,
      recommendedOperatorExtraHourPrice: 25,
      socialSecurityPct: 0.32,
      withholdingPct: 0.15,
    }));
    mockPrisma.pack.findMany.mockResolvedValue([
      {
        id: 'pack-1',
        slug: 'party',
        service: 'fiestas',
        price: 100,
        extraHourPrice: 30,
        djHours: 5,
        minGuests: 20,
        maxGuests: null,
        soundWatts: 2000,
        inventory: [
          {
            quantity: 1,
            item: {
              purchasePrice: null,
              expectedLifeHours: 2000,
            },
          },
        ],
      },
      {
        id: 'pack-2',
        slug: 'wedding-pro',
        service: 'bodas',
        price: 80,
        extraHourPrice: 20,
        djHours: 6,
        minGuests: 80,
        maxGuests: 180,
        soundWatts: 8000,
        inventory: [],
      },
    ]);

    const snapshot = await getAdminHealthSnapshot();
    const catalogSection = snapshot.sections.find((section) => section.scope === 'catalog');
    const operationsSection = snapshot.sections.find((section) => section.scope === 'operations');

    expect(snapshot.summary.critical).toBeGreaterThan(0);
    expect(snapshot.summary.warning).toBeGreaterThan(0);
    expect(snapshot.sections.find((section) => section.scope === 'system')?.counts.critical).toBeGreaterThan(0);
    expect(catalogSection?.items.some((item) => item.title.includes('stock crític'))).toBe(true);
    expect(catalogSection?.items.some((item) => item.title.includes('Extres venuts a preu 0'))).toBe(true);
    expect(catalogSection?.items.some((item) => item.title.includes('rang clar de convidats'))).toBe(true);
    expect(operationsSection?.items.some((item) => item.title.includes('Cobraments de reserves vençuts'))).toBe(true);
    expect(operationsSection?.items.some((item) => item.title.includes('Cobraments a punt de vèncer'))).toBe(true);
    expect(operationsSection?.items.some((item) => item.href === '/admin/leads')).toBe(true);
  });

  it('detecta inventari a fi de vida útil (critical >95%) i envellint (warning >80%)', async () => {
    mockPrisma.inventoryItem.findMany.mockReset();
    mockPrisma.inventoryItem.findMany
      .mockResolvedValueOnce([])  // lowStockRows
      .mockResolvedValueOnce([    // lifecycleRows
        { id: 'item-old', expectedLifeHours: 1000, usageHistory: [{ hoursUsed: 960 }] },
        { id: 'item-aging', expectedLifeHours: 2000, usageHistory: [{ hoursUsed: 1000 }, { hoursUsed: 700 }] },
        { id: 'item-fresh', expectedLifeHours: 2000, usageHistory: [{ hoursUsed: 200 }] },
      ]);

    const snapshot = await getAdminHealthSnapshot();
    const catalogSection = snapshot.sections.find((s) => s.scope === 'catalog');

    expect(catalogSection?.items.some((item) => item.id === 'catalog-inventory-end-of-life' && item.count === 1)).toBe(true);
    expect(catalogSection?.items.some((item) => item.id === 'catalog-inventory-aging' && item.count === 1)).toBe(true);
  });

  it('detecta inventari amb capital mort (comprat però mai usat)', async () => {
    mockPrisma.inventoryItem.count.mockReset();
    queueInventoryCounts(0, 0, 0, 5);

    const snapshot = await getAdminHealthSnapshot();
    const catalogSection = snapshot.sections.find((s) => s.scope === 'catalog');

    expect(catalogSection?.items.some((item) => item.id === 'catalog-inventory-unused' && item.count === 5)).toBe(true);
  });
});
