// app/api/admin/bookings/route.ts
// API per gestionar reserves
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { safeParseInt } from '@/lib/utils';
import { z } from 'zod';
import { BookingStatus, EventType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const bookingSchema = z.object({
  leadId: z.string().optional(),
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(1),
  eventType: z.enum([
    'WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION',
    'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'
  ]),
  eventDate: z.string(),
  eventStartTime: z.string().optional(),
  eventEndTime: z.string().optional(),
  eventLocation: z.string().min(1),
  eventVenue: z.string().optional(),
  guestCount: z.number().min(1),
  packId: z.string().min(1),
  extraHours: z.number().optional(),
  extras: z.array(z.object({
    extraId: z.string(),
    quantity: z.number().optional(),
    price: z.number(),
  })).optional(),
  discount: z.number().optional(),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

// Generar referència única
async function generateReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OE-${year}-`;

  const lastBooking = await prisma.booking.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
  });

  let nextNumber = 1;
  if (lastBooking) {
    const lastNumber = safeParseInt(lastBooking.reference.split('-').pop(), 0);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

// GET - Llistar reserves amb filtres
export async function GET(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');
    const page = safeParseInt(searchParams.get('page'), 1, 1);
    const limit = safeParseInt(searchParams.get('limit'), 50, 1, 200);

    // Validar enums
    const validStatus = status && Object.values(BookingStatus).includes(status as BookingStatus)
      ? (status as BookingStatus)
      : undefined;
    const validEventType = eventType && Object.values(EventType).includes(eventType as EventType)
      ? (eventType as EventType)
      : undefined;

    const where = {
      ...(validStatus && { status: validStatus }),
      ...(validEventType && { eventType: validEventType }),
      ...(fromDate && { eventDate: { gte: new Date(fromDate) } }),
      ...(toDate && { eventDate: { lte: new Date(toDate) } }),
      ...(search && {
        OR: [
          { clientName: { contains: search, mode: 'insensitive' as const } },
          { clientEmail: { contains: search, mode: 'insensitive' as const } },
          { reference: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          pack: { include: { translations: { where: { locale: 'ca' } } } },
          extras: { include: { extra: { include: { translations: { where: { locale: 'ca' } } } } } },
          lead: { select: { id: true, name: true, source: true } },
        },
        orderBy: { eventDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // Estadístiques
    const stats = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
      _sum: { total: true },
    });

    return NextResponse.json({
      ok: true,
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: stats.reduce((acc, s) => {
        acc[s.status] = { count: s._count, revenue: s._sum.total || 0 };
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>),
    });
  } catch (error) {
    console.error('Error obtenint reserves:', error);
    return NextResponse.json(
      { error: 'Error obtenint reserves' },
      { status: 500 }
    );
  }
}

// POST - Crear nova reserva
export async function POST(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Obtenir pack i preu
    const pack = await prisma.pack.findUnique({
      where: { id: data.packId },
    });

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack no trobat' },
        { status: 404 }
      );
    }

    // Calcular preus
    const packPrice = pack.price;
    const extraHoursPrice = (data.extraHours || 0) * pack.extraHourPrice;
    const extrasPrice = data.extras?.reduce((sum, e) => sum + e.price * (e.quantity || 1), 0) || 0;
    const subtotal = packPrice + extraHoursPrice + extrasPrice;
    const discount = data.discount || 0;
    const vatRate = 21;
    const baseAfterDiscount = subtotal - discount;
    const vatAmount = baseAfterDiscount * (vatRate / 100);
    const total = baseAfterDiscount + vatAmount;
    const depositAmount = Math.round(total * 0.3);

    const reference = await generateReference();

    const booking = await prisma.booking.create({
      data: {
        reference,
        leadId: data.leadId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        eventType: data.eventType,
        eventDate: new Date(data.eventDate),
        eventStartTime: data.eventStartTime,
        eventEndTime: data.eventEndTime,
        eventLocation: data.eventLocation,
        eventVenue: data.eventVenue,
        guestCount: data.guestCount,
        packId: data.packId,
        extraHours: data.extraHours || 0,
        subtotal,
        discount,
        discountCode: data.discountCode,
        vatRate,
        vatAmount,
        total,
        depositAmount,
        remainingAmount: total - depositAmount,
        notes: data.notes,
        extras: data.extras ? {
          create: data.extras.map(e => ({
            extraId: e.extraId,
            quantity: e.quantity || 1,
            price: e.price,
          })),
        } : undefined,
      },
      include: {
        pack: true,
        extras: { include: { extra: true } },
      },
    });

    // Si ve d'un lead, actualitzar-lo a WON
    if (data.leadId) {
      await prisma.lead.update({
        where: { id: data.leadId },
        data: {
          status: 'WON',
          convertedAt: new Date(),
        },
      });
    }

    // Crear disponibilitat
    await prisma.availability.upsert({
      where: { date: new Date(data.eventDate) },
      create: {
        date: new Date(data.eventDate),
        status: 'BOOKED',
        bookingId: booking.id,
      },
      update: {
        status: 'BOOKED',
        bookingId: booking.id,
      },
    });

    await prisma.adminLog.create({
      data: {
        action: 'CREATE',
        entity: 'booking',
        entityId: booking.id,
        details: { reference, clientName: data.clientName, total },
      },
    });

    return NextResponse.json({
      ok: true,
      booking,
    });
  } catch (error) {
    console.error('Error creant reserva:', error);
    return NextResponse.json(
      { error: 'Error creant reserva' },
      { status: 500 }
    );
  }
}
