import { prisma } from '@/lib/prisma';

export async function countOpenTasks(): Promise<number> {
  return prisma.task.count({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
  });
}
