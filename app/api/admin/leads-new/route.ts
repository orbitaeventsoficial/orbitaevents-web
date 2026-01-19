// app/api/admin/leads-new/route.ts
// API per gestionar leads (nou model)
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { safeParseInt } from '@/lib/utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Enum validation helpers
const VALID_STATUSES = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'] as const;
const VALID_EVENT_TYPES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'] as const;
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

type LeadStatus = typeof VALID_STATUSES[number];
type EventType = typeof VALID_EVENT_TYPES[number];
type Priority = typeof VALID_PRIORITIES[number];

function isValidStatus(value: string | null): value is LeadStatus {
  return value !== null && VALID_STATUSES.includes(value as LeadStatus);
}

function isValidEventType(value: string | null): value is EventType {
  return value !== null && VALID_EVENT_TYPES.includes(value as EventType);
}

function isValidPriority(value: string | null): value is Priority {
  return value !== null && VALID_PRIORITIES.includes(value as Priority);
}

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  eventType: z.enum([
    'WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION',
    'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'
  ]),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  eventVenue: z.string().optional(),
  guestCount: z.number().optional(),
  budget: z.string().optional(),
  message: z.string().optional(),
  interestedPackId: z.string().optional(),
  interestedExtras: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  source: z.enum([
    'WEBSITE', 'CONFIGURATOR', 'PHONE', 'WHATSAPP',
    'INSTAGRAM', 'REFERRAL', 'GOOGLE', 'OTHER'
  ]).optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

// GET - Llistar leads amb filtres
export async function GET(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);

    // Si només vol el comptador de leads nous
    const countOnly = searchParams.get('countOnly') === 'true';
    if (countOnly) {
      const count = await prisma.lead.count({ where: { status: 'NEW' } });
      return NextResponse.json({ ok: true, count });
    }

    const statusParam = searchParams.get('status');
    const eventTypeParam = searchParams.get('eventType');
    const priorityParam = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = safeParseInt(searchParams.get('page'), 1, 1);
    const limit = safeParseInt(searchParams.get('limit'), 50, 1, 200);

    const where = {
      ...(isValidStatus(statusParam) && { status: statusParam }),
      ...(isValidEventType(eventTypeParam) && { eventType: eventTypeParam }),
      ...(isValidPriority(priorityParam) && { priority: priorityParam }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [leads, total] = await Promise.all([
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    // Estadístiques
    const stats = await prisma.lead.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      ok: true,
      leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: stats.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    log.error('Error obtenint leads:', error);
    return NextResponse.json(
      { error: 'Error obtenint leads' },
      { status: 500 }
    );
  }
}

// POST - Crear nou lead
export async function POST(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

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

    return NextResponse.json({
      ok: true,
      lead,
    });
  } catch (error) {
    log.error('Error creant lead:', error);
    return NextResponse.json(
      { error: 'Error creant lead' },
      { status: 500 }
    );
  }
}
