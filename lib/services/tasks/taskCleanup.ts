import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type TaskCleanupClient = typeof prisma | Prisma.TransactionClient;

export async function deleteLeadTasks(tx: TaskCleanupClient, leadId: string): Promise<void> {
  await tx.task.deleteMany({ where: { leadId } });
  await tx.leadTask.deleteMany({ where: { leadId } });
}
