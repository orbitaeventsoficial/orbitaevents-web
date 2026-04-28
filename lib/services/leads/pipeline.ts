import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

type PipelineLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dni: string | null;
  eventType: string;
  source: string;
  eventDate: Date | null;
  status: string;
  lostReason: string | null;
  priority: string;
  customerId: string | null;
  budget: string | null;
  cachedScore: number | null;
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
      dni: true,
      source: true,
      eventDate: true,
      status: true,
      lostReason: true,
      priority: true,
      customerId: true,
      budget: true,
      cachedScore: true,
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
