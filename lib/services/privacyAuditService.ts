import { prisma } from '@/lib/prisma';

export async function listPrivacyAuditLogs(input: {
  limit: number;
  offset: number;
  action?: string | null;
}) {
  const where: Record<string, unknown> = {};
  if (input.action && input.action !== 'all') {
    where.action = input.action;
  }

  const [logs, total] = await Promise.all([
    prisma.privacyAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: input.limit,
      skip: input.offset,
    }),
    prisma.privacyAuditLog.count({ where }),
  ]);

  return { success: true, data: logs, total };
}
