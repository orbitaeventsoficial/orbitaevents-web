import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function listAdminPrivacyRequests(status: string | null, type: string | null, limit: number) {
  const where: Prisma.DataRequestWhereInput = {};

  if (status && status !== 'all') {
    where.status = status as Prisma.EnumDataRequestStatusFilter;
  }

  if (type && type !== 'all') {
    where.requestType = type as Prisma.EnumDataRequestTypeFilter;
  }

  const requests = await prisma.dataRequest.findMany({
    where,
    orderBy: [
      { status: 'asc' },
      { legalDeadline: 'asc' },
    ],
    take: limit,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    success: true,
    data: requests,
    count: requests.length,
  };
}
