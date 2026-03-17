import { prisma } from '@/lib/prisma';

type CustomerListInput = {
  includeStats: boolean;
  page: number;
  limit: number;
  q: string;
};

export async function listAdminCustomers(input: CustomerListInput) {
  const skip = (input.page - 1) * input.limit;
  const where = input.q
    ? {
        OR: [
          { id: { contains: input.q, mode: 'insensitive' as const } },
          { name: { contains: input.q, mode: 'insensitive' as const } },
          { nameNormalized: { contains: input.q, mode: 'insensitive' as const } },
          { email: { contains: input.q, mode: 'insensitive' as const } },
          { emailNormalized: { contains: input.q, mode: 'insensitive' as const } },
          { phone: { contains: input.q } },
          { phoneNormalized: { contains: input.q } },
          { dni: { contains: input.q, mode: 'insensitive' as const } },
          { dniNormalized: { contains: input.q, mode: 'insensitive' as const } },
          { instagram: { contains: input.q, mode: 'insensitive' as const } },
          { instagramNormalized: { contains: input.q, mode: 'insensitive' as const } },
          {
            discountCodes: {
              some: {
                code: { contains: input.q, mode: 'insensitive' as const },
              },
            },
          },
        ],
      }
    : undefined;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: input.limit,
      include: {
        _count: {
          select: {
            testimonials: true,
            discountCodes: true,
          },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const responseData: Record<string, unknown> = {
    customers,
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
    q: input.q,
  };

  if (input.includeStats) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [totalCustomers, withEvents, recentMonth, withGdpr, vip] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { totalEvents: { gt: 0 } } }),
      prisma.customer.count({ where: { createdAt: { gt: oneMonthAgo } } }),
      prisma.customer.count({ where: { gdprConsent: true } }),
      prisma.customer.count({ where: { totalSpent: { gte: 2000 } } }),
    ]);

    responseData.stats = {
      total: totalCustomers,
      withEvents,
      recentMonth,
      withGdpr,
      vip,
    };
  }

  return responseData;
}
