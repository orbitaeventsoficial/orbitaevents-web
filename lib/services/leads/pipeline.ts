import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type PipelineLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  eventType: string;
  source: string;
  eventDate: Date | null;
  status: string;
  priority: string;
  customerId: string | null;
  budget: string | null;
  // cachedScore: available after `prisma generate` (migration pending)
  createdAt: Date;
  booking: {
    id: string;
    reference: string;
  } | null;
};

export async function getPipelineLeads(limit: number, where?: Prisma.LeadWhereInput): Promise<PipelineLead[]> {
  const normalizedLimit = Math.max(1, Math.min(limit, 500));

  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: normalizedLimit,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      eventType: true,
      source: true,
      eventDate: true,
      status: true,
      priority: true,
      customerId: true,
      budget: true,
      // cachedScore: true, — uncomment after `prisma generate`
      createdAt: true,
      booking: {
        select: {
          id: true,
          reference: true,
        },
      },
    },
  });
}
