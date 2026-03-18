import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { count: vi.fn() },
    booking: { count: vi.fn() },
    task: {
      count: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { generateDailyChecklistTasks } from '@/lib/services/dailyChecklist';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: all counts 0 (no signals)
  mockPrisma.lead.count.mockResolvedValue(0);
  mockPrisma.booking.count.mockResolvedValue(0);
  mockPrisma.task.count.mockResolvedValue(0);
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.task.createMany.mockResolvedValue({ count: 0 });
  mockPrisma.task.updateMany.mockResolvedValue({ count: 0 });
  mockPrisma.task.deleteMany.mockResolvedValue({ count: 0 });
});

describe('generateDailyChecklistTasks', () => {
  it('no crea tasques si no hi ha senyals', async () => {
    const result = await generateDailyChecklistTasks();

    expect(result.created).toBe(0);
    expect(result.considered).toBe(0);
    expect(result.totalTemplates).toBe(5);
    expect(mockPrisma.task.createMany).not.toHaveBeenCalled();
  });

  it('crea tasca per leads nous', async () => {
    mockPrisma.lead.count.mockResolvedValueOnce(3); // newLeadsCount

    const result = await generateDailyChecklistTasks();

    expect(result.created).toBe(1);
    expect(result.signals.newLeadsCount).toBe(3);
    expect(mockPrisma.task.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          title: expect.stringContaining('entrades noves'),
          priority: 'URGENT',
          createdBy: 'system:daily-checklist',
        }),
      ]),
    });
  });

  it('crea tasca per pressupostos en joc', async () => {
    // lead.count called twice: first for newLeads (0), then quotesInPlay (5)
    mockPrisma.lead.count
      .mockResolvedValueOnce(0)   // newLeads
      .mockResolvedValueOnce(5);  // quotesInPlay

    const result = await generateDailyChecklistTasks();

    expect(result.created).toBe(1);
    expect(result.signals.quotesInPlayCount).toBe(5);
  });

  it('crea tasca per reserves properes', async () => {
    mockPrisma.booking.count.mockResolvedValueOnce(2); // upcomingBookings

    const result = await generateDailyChecklistTasks();

    expect(result.created).toBe(1);
    expect(result.signals.upcomingBookingsCount).toBe(2);
  });

  it('crea tasca per tasques vençudes', async () => {
    mockPrisma.task.count.mockResolvedValueOnce(4); // overdueTasksCount

    const result = await generateDailyChecklistTasks();

    expect(result.created).toBe(1);
    expect(result.signals.overdueTasksCount).toBe(4);
  });

  it('crea tasca per post-event pendents', async () => {
    // booking.count called twice: first for upcoming (0), then postEvent (1)
    mockPrisma.booking.count
      .mockResolvedValueOnce(0)   // upcomingBookings
      .mockResolvedValueOnce(1);  // postEventPending

    const result = await generateDailyChecklistTasks();

    expect(result.created).toBe(1);
    expect(result.signals.postEventPendingCount).toBe(1);
  });

  it('crea múltiples tasques si hi ha múltiples senyals', async () => {
    mockPrisma.lead.count
      .mockResolvedValueOnce(2)   // newLeads
      .mockResolvedValueOnce(3);  // quotesInPlay
    mockPrisma.booking.count
      .mockResolvedValueOnce(1)   // upcoming
      .mockResolvedValueOnce(0);  // postEvent
    mockPrisma.task.count.mockResolvedValueOnce(5); // overdue

    const result = await generateDailyChecklistTasks();

    expect(result.created).toBe(4); // leads + quotes + booking + overdue
    expect(result.considered).toBe(4);
  });

  it('no duplica tasques ja creades avui', async () => {
    mockPrisma.lead.count.mockResolvedValueOnce(3); // newLeads
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'existing-1',
        title: 'Checklist diari: revisar entrades noves',
        status: 'OPEN',
      },
    ]);

    const result = await generateDailyChecklistTasks();

    expect(result.created).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('cancel·la checklist antics no resolts', async () => {
    mockPrisma.task.updateMany.mockResolvedValueOnce({ count: 3 }); // stale cleanup

    const result = await generateDailyChecklistTasks();

    expect(result.staleCancelled).toBe(3);
    expect(mockPrisma.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdBy: 'system:daily-checklist',
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        }),
        data: expect.objectContaining({ status: 'CANCELLED' }),
      })
    );
  });

  it('elimina checklist automàtics antics (retenció 14d)', async () => {
    mockPrisma.task.deleteMany.mockResolvedValue({ count: 5 });

    const result = await generateDailyChecklistTasks();

    expect(result.oldDeleted).toBe(5);
    expect(mockPrisma.task.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdBy: 'system:daily-checklist',
          status: { in: ['CANCELLED', 'DONE'] },
        }),
      })
    );
  });

  it('cancel·la tasques d\'avui si el senyal desapareix', async () => {
    // All signals 0, but there's an existing task for "entrades noves"
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'today-1',
        title: 'Checklist diari: revisar entrades noves',
        status: 'OPEN',
      },
    ]);

    const result = await generateDailyChecklistTasks();

    expect(result.todayCancelled).toBe(1);
  });

  it('retorna estructura de resultat completa', async () => {
    const result = await generateDailyChecklistTasks();

    expect(result).toHaveProperty('created');
    expect(result).toHaveProperty('skipped');
    expect(result).toHaveProperty('staleCancelled');
    expect(result).toHaveProperty('oldDeleted');
    expect(result).toHaveProperty('todayCancelled');
    expect(result).toHaveProperty('considered');
    expect(result).toHaveProperty('totalTemplates');
    expect(result).toHaveProperty('signals');
    expect(result.signals).toHaveProperty('newLeadsCount');
    expect(result.signals).toHaveProperty('quotesInPlayCount');
    expect(result.signals).toHaveProperty('upcomingBookingsCount');
    expect(result.signals).toHaveProperty('overdueTasksCount');
    expect(result.signals).toHaveProperty('postEventPendingCount');
  });
});
