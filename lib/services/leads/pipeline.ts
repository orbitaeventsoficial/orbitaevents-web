import { prisma } from '@/lib/prisma';

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
  createdAt: Date;
  booking: {
    id: string;
    reference: string;
  } | null;
};

export async function getPipelineLeads(limit: number): Promise<PipelineLead[]> {
  const normalizedLimit = Math.max(1, Math.min(limit, 500));

  return prisma.lead.findMany({
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
