import { prisma } from '@/lib/prisma';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function endOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

function startOfDayAfter(days: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 0, 0, 0, 0);
}

function startOfYesterday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
}

export async function generateDailyChecklistTasks() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const weekAheadStart = startOfDayAfter(7);
  const yesterdayStart = startOfYesterday();
  const retentionStart = startOfDayAfter(-14);
  const now = new Date();

  const [
    newLeadsCount,
    quotesInPlayCount,
    upcomingBookingsCount,
    overdueTasksCount,
    postEventPendingCount,
  ] = await Promise.all([
    prisma.lead.count({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.lead.count({
      where: {
        status: { in: ['QUOTE_SENT', 'NEGOTIATING'] },
      },
    }),
    prisma.booking.count({
      where: {
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
        eventDate: { gte: todayStart, lt: weekAheadStart },
      },
    }),
    prisma.task.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        dueDate: { lt: todayStart },
        NOT: { createdBy: 'system:daily-checklist' },
      },
    }),
    prisma.booking.count({
      where: {
        status: 'COMPLETED',
        postEventEmailSent: false,
        eventDate: { gte: yesterdayStart, lt: todayStart },
      },
    }),
  ]);

  const templates: Array<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    shouldCreate: boolean;
  }> = [
    {
      title: 'Checklist diari: revisar entrades noves',
      description: 'Revisa entrades noves i mou estat de les més urgents.',
      priority: 'URGENT' as const,
      shouldCreate: newLeadsCount > 0,
    },
    {
      title: 'Checklist diari: seguir pressupostos en joc',
      description: 'Truca o escriu a pressupostos enviats/negociació.',
      priority: 'HIGH' as const,
      shouldCreate: quotesInPlayCount > 0,
    },
    {
      title: 'Checklist diari: validar reserves i calendari',
      description: 'Comprova reserves pròximes i bloquejos del calendari.',
      priority: 'HIGH' as const,
      shouldCreate: upcomingBookingsCount > 0,
    },
    {
      title: 'Checklist diari: tasques vençudes o pendents',
      description: 'Tanca tasques obertes i replanifica les vençudes.',
      priority: 'MEDIUM' as const,
      shouldCreate: overdueTasksCount > 0,
    },
    {
      title: 'Checklist diari: post-esdeveniment',
      description: 'Envia correus i tanca seguiment de post-esdeveniment.',
      priority: 'MEDIUM' as const,
      shouldCreate: postEventPendingCount > 0,
    },
  ];

  // Evitar acumulació: cancel·lar checklist antics no resolts.
  const staleCleanup = await prisma.task.updateMany({
    where: {
      createdBy: 'system:daily-checklist',
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      dueDate: { lt: todayStart },
    },
    data: {
      status: 'CANCELLED',
      completedAt: now,
    },
  });

  // Retenció: eliminar històric de checklist automàtic antic per evitar inflar el panell.
  const oldChecklistCleanup = await prisma.task.deleteMany({
    where: {
      createdBy: 'system:daily-checklist',
      status: { in: ['CANCELLED', 'DONE'] },
      dueDate: { lt: retentionStart },
    },
  });

  const existingToday = await prisma.task.findMany({
    where: {
      createdBy: 'system:daily-checklist',
      dueDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    select: { id: true, title: true, status: true },
  });
  const existingTodayByTitle = new Map(existingToday.map((task) => [task.title, task]));

  const toCreate = templates
    .filter((tpl) => tpl.shouldCreate)
    .filter((tpl) => !existingTodayByTitle.has(tpl.title))
    .map((tpl) => ({
      title: tpl.title,
      description: tpl.description,
      status: 'OPEN' as const,
      priority: tpl.priority,
      dueDate: todayEnd,
      createdBy: 'system:daily-checklist',
    }));

  const toCancelTodayIds = templates
    .filter((tpl) => !tpl.shouldCreate)
    .map((tpl) => existingTodayByTitle.get(tpl.title))
    .flatMap((task) => {
      if (!task) return [];
      if (task.status === 'OPEN' || task.status === 'IN_PROGRESS') return [task.id];
      return [];
    });

  if (toCreate.length > 0) {
    await prisma.task.createMany({ data: toCreate });
  }

  if (toCancelTodayIds.length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: toCancelTodayIds } },
      data: {
        status: 'CANCELLED',
        completedAt: now,
      },
    });
  }

  const considered = templates.filter((tpl) => tpl.shouldCreate).length;
  const created = toCreate.length;
  const skipped = Math.max(0, considered - created);

  return {
    created,
    skipped,
    staleCancelled: staleCleanup.count,
    oldDeleted: oldChecklistCleanup.count,
    todayCancelled: toCancelTodayIds.length,
    considered,
    totalTemplates: templates.length,
    signals: {
      newLeadsCount,
      quotesInPlayCount,
      upcomingBookingsCount,
      overdueTasksCount,
      postEventPendingCount,
    },
  };
}
