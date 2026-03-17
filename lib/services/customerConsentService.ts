import { prisma } from '@/lib/prisma';

export async function listCustomerConsentsAndRequests(customerId: string) {
  const [consents, requests] = await Promise.all([
    prisma.consentRecord.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dataRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { success: true, consents, requests };
}
