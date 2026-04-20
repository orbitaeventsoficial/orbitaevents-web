import { describe, it, expect } from 'vitest';
import { classifyTaskQueue, parseBudgetValue, type TaskQueueRawTask, type TaskQueueInput } from '@/lib/services/tasks/taskQueueService';

const NOW = new Date('2026-04-10T10:00:00Z');

function makeTask(overrides: Partial<TaskQueueRawTask> = {}): TaskQueueRawTask {
  return {
    id: overrides.id ?? 'task-1',
    title: overrides.title ?? 'Test task',
    status: 'OPEN',
    priority: 'MEDIUM',
    dueDate: null,
    createdAt: new Date('2026-04-09T08:00:00Z'),
    updatedAt: new Date('2026-04-09T08:00:00Z'),
    leadId: null,
    customerId: null,
    bookingId: null,
    leadName: null,
    customerName: null,
    customerLifecycleStage: null,
    leadBudget: null,
    ...overrides,
  };
}

function makeInput(tasks: TaskQueueRawTask[], overrides: Partial<TaskQueueInput> = {}): TaskQueueInput {
  return { tasks, now: NOW, ...overrides };
}

describe('classifyTaskQueue', () => {
  it('retorna buit quan no hi ha tasques', () => {
    const result = classifyTaskQueue(makeInput([]));
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
    expect(result.queues['VENÇUT']).toBe(0);
    expect(result.queues['AVUI']).toBe(0);
    expect(result.queues['VIP']).toBe(0);
    expect(result.queues['BLOQUEJAT']).toBe(0);
    expect(result.queues['NORMAL']).toBe(0);
  });

  it('classifica tasca vençuda com a VENÇUT', () => {
    const task = makeTask({ dueDate: new Date('2026-04-08T00:00:00Z') });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('VENÇUT');
    expect(result.items[0].daysOverdue).toBe(2);
    expect(result.items[0].queueReason).toContain('2 dies');
  });

  it('singular correcte per 1 dia vençut', () => {
    const task = makeTask({ dueDate: new Date('2026-04-09T00:00:00Z') });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].daysOverdue).toBe(1);
    expect(result.items[0].queueReason).toContain('1 dia');
  });

  it('classifica tasca per avui com a AVUI', () => {
    const task = makeTask({ dueDate: new Date('2026-04-10T15:00:00Z') });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('AVUI');
    expect(result.items[0].queueReason).toBe('Venç avui');
  });

  it('classifica tasca de client VIP com a VIP', () => {
    const task = makeTask({
      customerId: 'c1',
      customerName: 'Client VIP',
      customerLifecycleStage: 'VIP',
    });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('VIP');
    expect(result.items[0].isVip).toBe(true);
    expect(result.items[0].queueReason).toContain('Client VIP');
  });

  it('classifica tasca de lead alt valor com a VIP', () => {
    const task = makeTask({
      leadId: 'l1',
      leadName: 'Lead premium',
      leadBudget: 5000,
    });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('VIP');
    expect(result.items[0].queueReason).toContain('5000€');
  });

  it('lead amb budget < 2000 no és VIP', () => {
    const task = makeTask({
      leadId: 'l1',
      leadName: 'Lead normal',
      leadBudget: 1500,
    });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).not.toBe('VIP');
  });

  it('classifica tasca estancada com a BLOQUEJAT', () => {
    const task = makeTask({
      updatedAt: new Date('2026-04-01T00:00:00Z'), // 9 dies sense update
    });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('BLOQUEJAT');
    expect(result.items[0].daysSinceUpdate).toBe(9);
    expect(result.items[0].queueReason).toContain('9 dies');
  });

  it('staleDays configurable', () => {
    const task = makeTask({
      updatedAt: new Date('2026-04-07T00:00:00Z'), // 3 dies
    });
    // Default 7 dies → no bloquejat
    const r1 = classifyTaskQueue(makeInput([task]));
    expect(r1.items[0].queue).toBe('NORMAL');

    // Amb staleDays=2 → bloquejat
    const r2 = classifyTaskQueue(makeInput([task], { staleDays: 2 }));
    expect(r2.items[0].queue).toBe('BLOQUEJAT');
  });

  it('tasca recent sense dueDate és NORMAL', () => {
    const task = makeTask({ updatedAt: new Date('2026-04-09T12:00:00Z') });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('NORMAL');
  });

  it('VENÇUT té prioritat sobre VIP', () => {
    const task = makeTask({
      dueDate: new Date('2026-04-08T00:00:00Z'),
      customerId: 'c1',
      customerLifecycleStage: 'VIP',
    });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('VENÇUT');
    expect(result.items[0].queueReason).toContain('Client VIP');
  });

  it('AVUI té prioritat sobre VIP', () => {
    const task = makeTask({
      dueDate: new Date('2026-04-10T08:00:00Z'),
      customerId: 'c1',
      customerLifecycleStage: 'VIP',
    });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('AVUI');
  });

  it('ordena per queueScore descendent', () => {
    const tasks = [
      makeTask({ id: 'normal', updatedAt: new Date('2026-04-09T12:00:00Z') }),
      makeTask({ id: 'overdue', dueDate: new Date('2026-04-05T00:00:00Z') }),
      makeTask({ id: 'today', dueDate: new Date('2026-04-10T08:00:00Z') }),
    ];
    const result = classifyTaskQueue(makeInput(tasks));
    expect(result.items[0].id).toBe('overdue');
    expect(result.items[1].id).toBe('today');
    expect(result.items[2].id).toBe('normal');
  });

  it('priority afecta score dins la mateixa queue', () => {
    const tasks = [
      makeTask({ id: 'low', dueDate: new Date('2026-04-10T08:00:00Z'), priority: 'LOW' }),
      makeTask({ id: 'urgent', dueDate: new Date('2026-04-10T08:00:00Z'), priority: 'URGENT' }),
    ];
    const result = classifyTaskQueue(makeInput(tasks));
    expect(result.items[0].id).toBe('urgent');
    expect(result.items[1].id).toBe('low');
  });

  it('queues summary compta correctament', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: new Date('2026-04-08T00:00:00Z') }),
      makeTask({ id: 't2', dueDate: new Date('2026-04-10T08:00:00Z') }),
      makeTask({ id: 't3', customerId: 'c1', customerLifecycleStage: 'VIP' }),
      makeTask({ id: 't4', updatedAt: new Date('2026-04-01T00:00:00Z') }),
      makeTask({ id: 't5', updatedAt: new Date('2026-04-09T12:00:00Z') }),
    ];
    const result = classifyTaskQueue(makeInput(tasks));
    expect(result.total).toBe(5);
    expect(result.queues['VENÇUT']).toBe(1);
    expect(result.queues['AVUI']).toBe(1);
    expect(result.queues['VIP']).toBe(1);
    expect(result.queues['BLOQUEJAT']).toBe(1);
    expect(result.queues['NORMAL']).toBe(1);
  });

  it('entity resol customer > lead > booking', () => {
    const withCustomer = makeTask({ customerId: 'c1', leadId: 'l1', customerName: 'Maria' });
    const withLead = makeTask({ id: 't2', leadId: 'l1', leadName: 'Joan' });
    const withBooking = makeTask({ id: 't3', bookingId: 'b1' });
    const withNone = makeTask({ id: 't4' });

    const result = classifyTaskQueue(makeInput([withCustomer, withLead, withBooking, withNone]));
    const items = result.items;

    const c = items.find((i) => i.id === 'task-1')!;
    expect(c.entity.type).toBe('customer');
    expect(c.entity.name).toBe('Maria');

    const l = items.find((i) => i.id === 't2')!;
    expect(l.entity.type).toBe('lead');
    expect(l.entity.name).toBe('Joan');

    const b = items.find((i) => i.id === 't3')!;
    expect(b.entity.type).toBe('booking');

    const n = items.find((i) => i.id === 't4')!;
    expect(n.entity.type).toBeNull();
  });

  it('dueDate futura sense VIP ni stale és NORMAL', () => {
    const task = makeTask({
      dueDate: new Date('2026-04-15T00:00:00Z'),
      updatedAt: new Date('2026-04-09T12:00:00Z'),
    });
    const result = classifyTaskQueue(makeInput([task]));
    expect(result.items[0].queue).toBe('NORMAL');
  });

  it('VIP vençut suma bonus al score', () => {
    const vipOverdue = makeTask({
      id: 'vip-overdue',
      dueDate: new Date('2026-04-08T00:00:00Z'),
      customerId: 'c1',
      customerLifecycleStage: 'VIP',
      priority: 'MEDIUM',
    });
    const normalOverdue = makeTask({
      id: 'normal-overdue',
      dueDate: new Date('2026-04-08T00:00:00Z'),
      priority: 'MEDIUM',
    });
    const result = classifyTaskQueue(makeInput([vipOverdue, normalOverdue]));
    expect(result.items[0].id).toBe('vip-overdue');
    expect(result.items[0].queueScore).toBeGreaterThan(result.items[1].queueScore);
  });
});

// Regressió: `parseBudgetValue` al wrapper `loadTaskQueue`. Abans `Number(budget)`
// feia que un lead amb pressupost "2.500" es veiés com 2.5 al banner de tasques
// i mai entrés a la cua VIP (llindar 2000 €).
describe('parseBudgetValue', () => {
  it('format europeu "2.500" → 2500 (entra llindar VIP)', () => {
    expect(parseBudgetValue('2.500')).toBe(2500);
  });

  it('format europeu "2.500,50 €" → 2500.5', () => {
    expect(parseBudgetValue('2.500,50 €')).toBeCloseTo(2500.5, 1);
  });

  it('enter simple "1500" → 1500 (no arriba a VIP)', () => {
    expect(parseBudgetValue('1500')).toBe(1500);
  });

  it('null / "" → 0', () => {
    expect(parseBudgetValue(null)).toBe(0);
    expect(parseBudgetValue('')).toBe(0);
  });

  it('text invàlid → 0 (no NaN)', () => {
    expect(parseBudgetValue('no ho sé')).toBe(0);
  });
});
