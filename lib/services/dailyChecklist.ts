import { prisma } from '@/lib/prisma';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function endOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

export async function generateDailyChecklistTasks() {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const templates = [
    {
      title: 'Checklist diari: revisar entrades noves',
      description: 'Revisa entrades noves i mou estat de les més urgents.',
      priority: 'URGENT' as const,
    },
    {
      title: 'Checklist diari: seguir pressupostos en joc',
      description: 'Truca o escriu a pressupostos enviats/negociació.',
      priority: 'HIGH' as const,
    },
    {
      title: 'Checklist diari: validar reserves i calendari',
      description: 'Comprova reserves pròximes i bloquejos del calendari.',
      priority: 'HIGH' as const,
    },
    {
      title: 'Checklist diari: tasques vençudes o pendents',
      description: 'Tanca tasques obertes i replanifica les vençudes.',
      priority: 'MEDIUM' as const,
    },
    {
      title: 'Checklist diari: post-esdeveniment',
      description: 'Envia correus i tanca seguiment de post-esdeveniment.',
      priority: 'MEDIUM' as const,
    },
  ];

  const existing = await prisma.task.findMany({
    where: {
      createdBy: 'system:daily-checklist',
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((e) => e.title));

  const toCreate = templates
    .filter((tpl) => !existingTitles.has(tpl.title))
    .map((tpl) => ({
      title: tpl.title,
      description: tpl.description,
      status: 'OPEN' as const,
      priority: tpl.priority,
      dueDate: todayEnd,
      createdBy: 'system:daily-checklist',
    }));

  if (toCreate.length > 0) {
    await prisma.task.createMany({ data: toCreate });
  }

  return {
    created: toCreate.length,
    skipped: templates.length - toCreate.length,
    totalTemplates: templates.length,
  };
}

