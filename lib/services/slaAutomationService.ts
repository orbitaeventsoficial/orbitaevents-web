import { prisma } from '@/lib/prisma';
import { createUniversalTask } from '@/lib/services/tasks/taskCreation';

const SLA_HOURS = 24;

interface SlaAutomationSummary {
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

  const openAutoTasks = await prisma.task.count({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS'] },
      createdBy: 'SLA Bot',
    },
  });

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

    await createUniversalTask({
      customerId: lead.customerId || null,
      leadId: lead.id,
      title: '[AUTO][SLA] Contactar lead en risc',
      description: `Lead NEW amb més de ${SLA_HOURS}h sense contacte. Executar trucada/WhatsApp avui.`,
      dueDate: due,
      priority: 'URGENT',
      status: 'OPEN',
      createdBy: 'SLA Bot',
      assignedTo: lead.assignedTo || null,
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'TASK',
        title: 'SLA incomplert: tasca automàtica creada',
        description: `Es crea tasca automàtica en superar ${SLA_HOURS}h en estat NEW.`,
        createdBy: 'SLA Bot',
        metadata: { slaHours: SLA_HOURS },
      },
    });

    if (lead.priority === 'LOW' || lead.priority === 'MEDIUM') {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { priority: 'HIGH' },
      });
      escalatedPriority += 1;
    }

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
