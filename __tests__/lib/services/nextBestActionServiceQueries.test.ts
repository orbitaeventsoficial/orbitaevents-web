import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockLoadCapacityConflicts } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
    task: { findMany: vi.fn() },
  },
  mockLoadCapacityConflicts: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/responseTrackingService', () => ({
  loadPendingFollowUps: vi.fn().mockResolvedValue({ generatedAt: '', total: 0, urgent: 0, normal: 0, low: 0, items: [] }),
}));
vi.mock('@/lib/services/capacityConflictService', () => ({
  loadCapacityConflicts: mockLoadCapacityConflicts,
}));
vi.mock('@/lib/services/leadPipelineSuggestionsService', () => ({
  loadPipelineSuggestions: vi.fn().mockResolvedValue([]),
}));
vi.mock('@/lib/log', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { loadNextBestActions } from '@/lib/services/nextBestActionService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.lead.findMany.mockResolvedValue([]);
  mockPrisma.customer.findMany.mockResolvedValue([]);
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockLoadCapacityConflicts.mockResolvedValue({ generatedAt: '', windowDays: 14, conflicts: [], verdict: '' });
});

describe('loadNextBestActions — filtres tasques', () => {
  const now = new Date('2026-04-19T10:00:00Z');

  it('lead.universalTasks exclou DONE i CANCELLED (no només DONE)', async () => {
    await loadNextBestActions(now);

    const call = mockPrisma.lead.findMany.mock.calls[0][0];
    expect(call.select.universalTasks.where.status).toEqual({ notIn: ['DONE', 'CANCELLED'] });
    expect(call.select.universalTasks.where.dueDate).toEqual({ lt: now });
  });

  it('customer.tasks exclou DONE i CANCELLED (no només DONE)', async () => {
    await loadNextBestActions(now);

    const call = mockPrisma.customer.findMany.mock.calls[0][0];
    expect(call.select.tasks.where.status).toEqual({ notIn: ['DONE', 'CANCELLED'] });
  });

  it('customer bookings carrega cashAmount per calcular pendent cash-aware', async () => {
    await loadNextBestActions(now);

    const call = mockPrisma.customer.findMany.mock.calls[0][0];
    expect(call.select.bookings.select).toMatchObject({
      total: true,
      depositAmount: true,
      remainingAmount: true,
      depositPaid: true,
      remainingPaid: true,
      cashAmount: true,
    });
  });

  it('no genera COLLECT_PAYMENT si el cashAmount ja cobreix el total del client', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([{
      id: 'cust-cash',
      name: 'Client efectiu',
      lifecycleStage: 'ACTIVE',
      healthScore: 80,
      lastContactedAt: new Date('2026-04-18T10:00:00Z'),
      totalSpent: 500,
      bookings: [{
        total: 500,
        depositAmount: 100,
        remainingAmount: 400,
        depositPaid: false,
        remainingPaid: false,
        cashAmount: 500,
      }],
      tasks: [],
    }]);

    const report = await loadNextBestActions(now);

    expect(report.actions.find((action) => action.actionType === 'COLLECT_PAYMENT')).toBeUndefined();
  });

  it('task.findMany ja exclou DONE i CANCELLED (coherència)', async () => {
    await loadNextBestActions(now);

    const call = mockPrisma.task.findMany.mock.calls[0][0];
    expect(call.where.status).toEqual({ notIn: ['DONE', 'CANCELLED'] });
  });

  it('reutilitza capacity pre-carregada sense tornar a consultar conflictes', async () => {
    await loadNextBestActions(now, {
      capacity: { generatedAt: now.toISOString(), windowDays: 14, conflicts: [], verdict: 'preloaded' },
    });

    expect(mockLoadCapacityConflicts).not.toHaveBeenCalled();
  });
});
