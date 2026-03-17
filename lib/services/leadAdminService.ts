import { prisma } from '@/lib/prisma';
import { PLACEHOLDER_EMAIL_DOMAIN } from '@/lib/constants';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';
type EventType = 'WEDDING' | 'BIRTHDAY' | 'CORPORATE' | 'COMMUNION' | 'BAPTISM' | 'GRADUATION' | 'ANNIVERSARY' | 'PRIVATE_PARTY' | 'OTHER';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type LeadListInput = {
  status?: LeadStatus | null;
  eventType?: EventType | null;
  priority?: Priority | null;
  search?: string | null;
  page: number;
  limit: number;
};

type LeadCreateInput = {
  name: string;
  email: string;
  phone?: string;
  eventType: EventType;
  eventDate?: string;
  eventLocation?: string;
  eventVenue?: string;
  guestCount?: number;
  budget?: string;
  message?: string;
  interestedPackId?: string;
  interestedExtras?: string[];
  assignedTo?: string;
  source?: 'WEBSITE' | 'CONFIGURATOR' | 'PHONE' | 'WHATSAPP' | 'INSTAGRAM' | 'WALLAPOP' | 'REFERRAL' | 'GOOGLE' | 'OTHER';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  priority?: Priority;
};

export async function countNewAdminLeads() {
  const count = await prisma.lead.count({
    where: {
      status: 'NEW',
      NOT: { email: { contains: PLACEHOLDER_EMAIL_DOMAIN } },
    },
  });

  return { ok: true, count };
}

export async function listAdminLeads(input: LeadListInput) {
  const where = {
    ...(input.status && { status: input.status }),
    ...(input.eventType && { eventType: input.eventType }),
    ...(input.priority && { priority: input.priority }),
    ...(input.search && {
      OR: [
        { name: { contains: input.search, mode: 'insensitive' as const } },
        { email: { contains: input.search, mode: 'insensitive' as const } },
        { phone: { contains: input.search } },
      ],
    }),
  };

  const [leads, total, stats] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        notes: { orderBy: { createdAt: 'desc' }, take: 3 },
        booking: { select: { id: true, reference: true, status: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ['status'], _count: true }),
  ]);

  return {
    ok: true,
    leads,
    total,
    page: input.page,
    totalPages: Math.ceil(total / input.limit),
    stats: stats.reduce((acc, row) => {
      acc[row.status] = row._count;
      return acc;
    }, {} as Record<string, number>),
  };
}

export async function createAdminLead(data: LeadCreateInput) {
  const lead = await prisma.lead.create({
    data: {
      ...data,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      interestedExtras: data.interestedExtras || [],
    },
  });

  await prisma.adminLog.create({
    data: {
      action: 'CREATE',
      entity: 'lead',
      entityId: lead.id,
      details: { name: lead.name, eventType: lead.eventType },
    },
  });

  return { ok: true, lead };
}
