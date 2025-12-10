// app/api/admin/leads-new/route.ts
// API per gestionar leads (nou model)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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
  guestCount: z.number().optional(),
  budget: z.string().optional(),
  message: z.string().optional(),
  interestedPackId: z.string().optional(),
  interestedExtras: z.array(z.string()).optional(),
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
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = {
      ...(status && { status: status as any }),
      ...(eventType && { eventType: eventType as any }),
      ...(priority && { priority: priority as any }),
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
    console.error('Error obtenint leads:', error);
    return NextResponse.json(
      { error: 'Error obtenint leads' },
      { status: 500 }
    );
  }
}

// POST - Crear nou lead
export async function POST(req: NextRequest) {
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
    console.error('Error creant lead:', error);
    return NextResponse.json(
      { error: 'Error creant lead' },
      { status: 500 }
    );
  }
}
