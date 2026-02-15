import { prisma } from '@/lib/prisma';

const SLA_HOURS = 24;

export interface SlaAutomationSummary {
  slaHours: number;
  staleLeads: number;
  createdTasks: number;
  escalatedPriority: number;
  affectedLeadIds: string[];
}

export async function getSlaSnapshot() {
  const threshold = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);
  const staleCount = await prisma.lead.count({
    where: {
      status: 'NEW',
      createdAt: { lte: threshold },
    },
  });

  const openAutoTasks = await (async () => {
    try {
      const prismaAny = prisma as any;
      return await prismaAny.task.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          createdBy: 'SLA Bot',
        },
      });
    } catch {
      return prisma.leadTask.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          createdBy: 'SLA Bot',
        },
      });
    }
  })();

  return {
    slaHours: SLA_HOURS,
    staleLeads: staleCount,
    openAutoTasks,
  };
}

export async function enforceLeadSla(): Promise<SlaAutomationSummary> {
  const threshold = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);
  const staleLeads = await prisma.lead.findMany({
    where: {
      status: 'NEW',
      createdAt: { lte: threshold },
    },
    include: {
      tasks: {
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          createdBy: 'SLA Bot',
        },
        take: 5,
      },
    },
    take: 300,
  });

  let createdTasks = 0;
  let escalatedPriority = 0;
  const affectedLeadIds: string[] = [];

  for (const lead of staleLeads) {
    if (lead.tasks.length > 0) continue;
    affectedLeadIds.push(lead.id);

    const due = new Date();
    due.setHours(due.getHours() + 4);

    await prisma.$transaction(async (tx) => {
      const createdLegacyTask = await tx.leadTask.create({
        data: {
          leadId: lead.id,
          title: '[AUTO][SLA] Contactar lead en riesgo',
          description: `Lead NEW con más de ${SLA_HOURS}h sin contacto. Ejecutar llamada/WhatsApp hoy.`,
          dueDate: due,
          priority: 'URGENT',
          status: 'OPEN',
          createdBy: 'SLA Bot',
          assignedTo: lead.assignedTo || null,
        },
      });

      try {
        const txAny = tx as any;
        await txAny.task.create({
          data: {
            legacyLeadTaskId: createdLegacyTask.id,
            customerId: lead.customerId || null,
            leadId: lead.id,
            title: createdLegacyTask.title,
            description: createdLegacyTask.description,
            dueDate: createdLegacyTask.dueDate,
            priority: createdLegacyTask.priority,
            status: createdLegacyTask.status,
            assignedTo: createdLegacyTask.assignedTo,
            createdBy: createdLegacyTask.createdBy,
          },
        });
      } catch {
        // Keep SLA flow non-blocking if universal tasks table is not available yet.
      }

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'TASK',
          title: 'SLA incumplido: tarea automática creada',
          description: `Se crea tarea automática al superar ${SLA_HOURS}h en estado NEW.`,
          createdBy: 'SLA Bot',
          metadata: { slaHours: SLA_HOURS },
        },
      });

      if (lead.priority === 'LOW' || lead.priority === 'MEDIUM') {
        await tx.lead.update({
          where: { id: lead.id },
          data: { priority: 'HIGH' },
        });
        escalatedPriority += 1;
      }
    });

    createdTasks += 1;
  }

  return {
    slaHours: SLA_HOURS,
    staleLeads: staleLeads.length,
    createdTasks,
    escalatedPriority,
    affectedLeadIds,
  };
}
