// lib/services/tasks/taskQueueService.ts
// ═══════════════════════════════════════════════════════════════════════════
// SMART TASK QUEUE SERVICE
// Classifica tasques obertes en queues operatives intel·ligents:
// VENÇUT · AVUI · VIP · BLOQUEJAT · NORMAL
// Funció pura + wrapper.
// ═══════════════════════════════════════════════════════════════════════════

import { prisma } from '@/lib/prisma';
import { parseBudgetAmount } from '@/lib/constants';

// Wrapper de la font canònica `parseBudgetAmount` (lib/constants); retorna 0 en
// comptes de null per als consumidors que sumen el valor.
export function parseBudgetValue(input?: string | null): number {
  return parseBudgetAmount(input) ?? 0;
}

// ───────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────

export type TaskQueue = 'VENÇUT' | 'AVUI' | 'VIP' | 'BLOQUEJAT' | 'NORMAL';

export type TaskQueueItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  queue: TaskQueue;
  queueScore: number;
  queueReason: string;
  entity: {
    type: 'customer' | 'lead' | 'booking' | null;
    id: string | null;
    name: string | null;
  };
  isVip: boolean;
  daysSinceUpdate: number;
  daysOverdue: number | null;
};

export type TaskQueueSummary = {
  total: number;
  queues: Record<TaskQueue, number>;
  items: TaskQueueItem[];
};

export type TaskQueueRawTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  leadId: string | null;
  customerId: string | null;
  bookingId: string | null;
  leadName: string | null;
  customerName: string | null;
  customerLifecycleStage: string | null;
  leadBudget: number | null;
};

export type TaskQueueInput = {
  tasks: TaskQueueRawTask[];
  now: Date;
  staleDays?: number;
};

// ───────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_STALE_DAYS = 7;

const PRIORITY_SCORE: Record<string, number> = {
  URGENT: 40,
  HIGH: 30,
  MEDIUM: 20,
  LOW: 10,
};

// ───────────────────────────────────────────────────────────────────────────
// PURE FUNCTION
// ───────────────────────────────────────────────────────────────────────────

export function classifyTaskQueue(input: TaskQueueInput): TaskQueueSummary {
  const { tasks, now, staleDays = DEFAULT_STALE_DAYS } = input;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const staleThreshold = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);

  const items: TaskQueueItem[] = tasks.map((task) => {
    const isVip = task.customerLifecycleStage === 'VIP' || (task.leadBudget !== null && task.leadBudget >= 2000);
    const daysSinceUpdate = Math.floor((now.getTime() - task.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const dueDateLocal = task.dueDate
      ? new Date(task.dueDate.getFullYear(), task.dueDate.getMonth(), task.dueDate.getDate())
      : null;
    const daysOverdue = dueDateLocal && dueDateLocal < todayStart
      ? Math.round((todayStart.getTime() - dueDateLocal.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine queue
    let queue: TaskQueue;
    let queueReason: string;
    let queueScore: number;

    if (dueDateLocal && dueDateLocal < todayStart) {
      queue = 'VENÇUT';
      queueReason = `Vençuda fa ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dies'}`;
      queueScore = 1000 + (daysOverdue ?? 0) * 10 + (PRIORITY_SCORE[task.priority] ?? 0);
    } else if (dueDateLocal && dueDateLocal.getTime() === todayStart.getTime()) {
      queue = 'AVUI';
      queueReason = 'Venç avui';
      queueScore = 800 + (PRIORITY_SCORE[task.priority] ?? 0);
    } else if (isVip) {
      queue = 'VIP';
      queueReason = task.customerLifecycleStage === 'VIP'
        ? 'Client VIP'
        : `Lead alt valor (${task.leadBudget}€)`;
      queueScore = 600 + (PRIORITY_SCORE[task.priority] ?? 0);
    } else if (task.updatedAt < staleThreshold) {
      queue = 'BLOQUEJAT';
      queueReason = `Sense moviment fa ${daysSinceUpdate} dies`;
      queueScore = 400 + daysSinceUpdate + (PRIORITY_SCORE[task.priority] ?? 0);
    } else {
      queue = 'NORMAL';
      queueReason = '';
      queueScore = 200 + (PRIORITY_SCORE[task.priority] ?? 0);
    }

    // Overdue VIP tasks get extra boost
    if (queue === 'VENÇUT' && isVip) {
      queueScore += 100;
      queueReason += ' · Client VIP';
    }

    const entityType = task.customerId ? 'customer' as const
      : task.leadId ? 'lead' as const
      : task.bookingId ? 'booking' as const
      : null;
    const entityId = task.customerId ?? task.leadId ?? task.bookingId ?? null;
    const entityName = task.customerName ?? task.leadName ?? null;

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      queue,
      queueScore,
      queueReason,
      entity: { type: entityType, id: entityId, name: entityName },
      isVip,
      daysSinceUpdate,
      daysOverdue,
    };
  });

  // Sort by score descending
  items.sort((a, b) => b.queueScore - a.queueScore);

  const queues: Record<TaskQueue, number> = {
    'VENÇUT': 0,
    'AVUI': 0,
    'VIP': 0,
    'BLOQUEJAT': 0,
    'NORMAL': 0,
  };
  for (const item of items) {
    queues[item.queue]++;
  }

  return { total: items.length, queues, items };
}

// ───────────────────────────────────────────────────────────────────────────
// WRAPPER
// ───────────────────────────────────────────────────────────────────────────

export async function loadTaskQueue(now: Date = new Date()): Promise<TaskQueueSummary> {
  const rows = await prisma.task.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
    },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    include: {
      lead: { select: { id: true, name: true, budget: true } },
      customer: { select: { id: true, name: true, lifecycleStage: true } },
    },
    take: 200,
  });

  const tasks: TaskQueueRawTask[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    priority: r.priority,
    dueDate: r.dueDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    leadId: r.leadId,
    customerId: r.customerId,
    bookingId: r.bookingId,
    leadName: r.lead?.name ?? null,
    customerName: r.customer?.name ?? null,
    customerLifecycleStage: r.customer?.lifecycleStage ?? null,
    leadBudget: r.lead?.budget ? parseBudgetValue(r.lead.budget) : null,
  }));

  return classifyTaskQueue({ tasks, now });
}
