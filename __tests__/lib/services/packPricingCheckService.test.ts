import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockComputeHealth, mockGetConfig } = vi.hoisted(() => ({
  mockPrisma: {
    pack: { findMany: vi.fn() },
    task: { findFirst: vi.fn(), create: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockComputeHealth: vi.fn(),
  mockGetConfig: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/packPricingHealth', () => ({
  computePackPricingHealth: mockComputeHealth,
  getPackPricingModelConfig: mockGetConfig,
}));

import { runPackPricingCheck } from '@/lib/services/packPricingCheckService';

beforeEach(() => {
  vi.clearAllMocks();
  mockGetConfig.mockResolvedValue({});
  mockPrisma.pack.findMany.mockResolvedValue([]);
  mockPrisma.task.findFirst.mockResolvedValue(null);
  mockPrisma.task.create.mockResolvedValue({ id: 'task-1' });
  mockPrisma.adminLog.create.mockResolvedValue({});
});

describe('runPackPricingCheck', () => {
  it('retorna 0 tasques si no hi ha packs', async () => {
    const result = await runPackPricingCheck();

    expect(result.reviewed).toBe(0);
    expect(result.tasksCreated).toBe(0);
    expect(mockPrisma.adminLog.create).toHaveBeenCalled();
  });

  it('no crea tasca si divergència < 15%', async () => {
    mockPrisma.pack.findMany.mockResolvedValue([{ id: 'p1', slug: 'basic' }]);
    mockComputeHealth.mockReturnValue({ divergencePct: 10, publicPrice: 500, recommendedPrice: 550 });

    const result = await runPackPricingCheck();

    expect(result.reviewed).toBe(1);
    expect(result.tasksCreated).toBe(0);
    expect(mockPrisma.task.create).not.toHaveBeenCalled();
  });

  it('crea tasca MEDIUM si divergència 15-30%', async () => {
    mockPrisma.pack.findMany.mockResolvedValue([{ id: 'p1', slug: 'premium' }]);
    mockComputeHealth.mockReturnValue({ divergencePct: 20, publicPrice: 500, recommendedPrice: 600 });

    const result = await runPackPricingCheck();

    expect(result.tasksCreated).toBe(1);
    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        priority: 'MEDIUM',
        createdBy: 'system:pack-pricing-check',
        source: 'PACK_PRICING',
      }),
    });
  });

  it('crea tasca HIGH si divergència >= 30%', async () => {
    mockPrisma.pack.findMany.mockResolvedValue([{ id: 'p1', slug: 'premium' }]);
    mockComputeHealth.mockReturnValue({ divergencePct: 35, publicPrice: 500, recommendedPrice: 750 });

    const result = await runPackPricingCheck();

    expect(result.tasksCreated).toBe(1);
    expect(mockPrisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ priority: 'HIGH' }),
    });
  });

  it('no crea tasca si ja existeix una oberta', async () => {
    mockPrisma.pack.findMany.mockResolvedValue([{ id: 'p1', slug: 'premium' }]);
    mockComputeHealth.mockReturnValue({ divergencePct: 25, publicPrice: 500, recommendedPrice: 625 });
    mockPrisma.task.findFirst.mockResolvedValue({ id: 'existing-task' });

    const result = await runPackPricingCheck();

    expect(result.tasksCreated).toBe(0);
  });

  it('detecta divergència negativa', async () => {
    mockPrisma.pack.findMany.mockResolvedValue([{ id: 'p1', slug: 'basic' }]);
    mockComputeHealth.mockReturnValue({ divergencePct: -20, publicPrice: 400, recommendedPrice: 500 });

    const result = await runPackPricingCheck();

    expect(result.tasksCreated).toBe(1);
  });
});
