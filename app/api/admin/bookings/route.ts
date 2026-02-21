// app/api/admin/bookings/route.ts
// API per gestionar reserves
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';
import { safeParseInt } from '@/lib/utils';
import { z } from 'zod';
import { BookingStatus, EventType } from '@prisma/client';
import { calculateTravelCharge, calculateTravelCost, DEFAULT_FUEL_COST_PER_KM, sanitizeNonNegative } from '@/lib/services/travelCost';
import { getFuelCostPerKmReference } from '@/lib/services/fuelReferenceService';
import { calculateGoogleMapsDistance } from '@/lib/services/googleMapsDistance';

export const dynamic = 'force-dynamic';
const OPERATOR_EXTRA_ID = '__operator_extra__';
const OPERATOR_EXTRA_SLUG = 'operator-support-hour';

const bookingSchema = z.object({
  leadId: z.string().optional(),
  customerId: z.string().optional(),
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
  distanceKm: z.number().min(0).optional(),
  fuelCostPerKm: z.number().min(0).optional(),
  travelCost: z.number().min(0).optional(),
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

async function ensureOperatorSupportExtraId(): Promise<string> {
  const existing = await prisma.extra.findUnique({
    where: { slug: OPERATOR_EXTRA_SLUG },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.extra.create({
    data: {
      slug: OPERATOR_EXTRA_SLUG,
      priceType: 'PER_HOUR',
      price: 0,
      isActive: true,
      translations: {
        create: [
          { locale: 'ca', name: 'Operari de suport (hora)', description: 'Suport operatiu addicional per hora' },
          { locale: 'es', name: 'Operario de soporte (hora)', description: 'Soporte operativo adicional por hora' },
          { locale: 'en', name: 'Support operator (hour)', description: 'Additional operational support per hour' },
        ],
      },
    },
    select: { id: true },
  });
  return created.id;
}

async function resolveExtraId(input: string): Promise<string | null> {
  if (input === OPERATOR_EXTRA_ID) {
    return ensureOperatorSupportExtraId();
  }

  const byId = await prisma.extra.findUnique({
    where: { id: input },
    select: { id: true },
  });
  if (byId) return byId.id;

  const bySlug = await prisma.extra.findUnique({
    where: { slug: input },
    select: { id: true },
  });
  return bySlug?.id || null;
}

// GET - Llistar reserves amb filtres
export async function GET(req: NextRequest) {
  // Verificar autenticació
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);

  try {
    const { searchParams } = new URL(req.url);
    const localeParam = String(searchParams.get('locale') || 'ca').toLowerCase();
    const locale =
      localeParam.startsWith('es') ? 'es' : localeParam.startsWith('en') ? 'en' : 'ca';
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const search = searchParams.get('search');
    const page = safeParseInt(searchParams.get('page'), 1, 1);
    const limit = safeParseInt(searchParams.get('limit'), 25, 1, 200);

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
          pack: { include: { translations: { where: { locale } } } },
          extras: { include: { extra: { include: { translations: { where: { locale } } } } } },
          lead: { select: { id: true, name: true, source: true, preferredLocale: true } },
          customer: { select: { id: true, name: true, email: true } },
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
    log.error('Error obtenint reserves:', error, {
      context: { requestId, endpoint: 'admin/bookings:GET' },
    });
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
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);
  let customerIdForLog: string | null = null;

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
    let linkedCustomerId: string | null = data.customerId || null;

    if (!linkedCustomerId && data.leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: data.leadId },
        select: { customerId: true },
      });
      linkedCustomerId = lead?.customerId || null;
    }

    if (!linkedCustomerId) {
      const byEmail = await prisma.customer.findUnique({
        where: { emailNormalized: data.clientEmail.trim().toLowerCase() },
        select: { id: true },
      });
      linkedCustomerId = byEmail?.id || null;
    }
    customerIdForLog = linkedCustomerId;

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
    const subtotalBase = packPrice + extraHoursPrice + extrasPrice;
    let distanceKm = data.distanceKm != null ? sanitizeNonNegative(data.distanceKm, 0) : null;
    if (distanceKm == null) {
      const destination = [data.eventVenue || '', data.eventLocation || ''].filter(Boolean).join(', ').trim();
      if (destination) {
        try {
          const route = await calculateGoogleMapsDistance({ destination });
          distanceKm = sanitizeNonNegative(route.roundTripKm, 0);
        } catch {
          distanceKm = null;
        }
      }
    }
    const fuelReference = await getFuelCostPerKmReference();
    const effectiveFuelCostPerKm = sanitizeNonNegative(
      data.fuelCostPerKm ?? fuelReference.costPerKm,
      DEFAULT_FUEL_COST_PER_KM
    );
    const fuelCostPerKm = effectiveFuelCostPerKm;
    const travelCost = distanceKm != null
      ? calculateTravelCost(distanceKm, fuelCostPerKm)
      : null;
    const travelCharge = distanceKm != null ? calculateTravelCharge(distanceKm) : 0;
    const subtotal = subtotalBase + travelCharge;
    const discount = data.discount || 0;
    const vatRate = 21;
    const baseAfterDiscount = subtotal - discount;
    const vatAmount = baseAfterDiscount * (vatRate / 100);
    const total = baseAfterDiscount + vatAmount;
    const depositAmount = Math.round(total * 0.3);

    const reference = await generateReference();

    const resolvedExtras = data.extras
      ? (await Promise.all(
          data.extras.map(async (e) => {
            const resolvedId = await resolveExtraId(e.extraId);
            if (!resolvedId) return null;
            return {
              extraId: resolvedId,
              quantity: e.quantity || 1,
              price: e.price,
            };
          })
        )).filter(Boolean) as Array<{ extraId: string; quantity: number; price: number }>
      : [];

    const booking = await prisma.booking.create({
      data: {
        reference,
        leadId: data.leadId,
        customerId: linkedCustomerId,
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
        distanceKm,
        fuelCostPerKm,
        travelCost,
        subtotal,
        discount,
        discountCode: data.discountCode,
        vatRate,
        vatAmount,
        total,
        depositAmount,
        remainingAmount: total - depositAmount,
        notes: data.notes,
        extras: resolvedExtras.length > 0 ? { create: resolvedExtras } : undefined,
      },
      include: {
        pack: true,
        extras: { include: { extra: true } },
      },
    });

    // Auto-assignar inventari del pack a la reserva (també per packs personalitzats amb lot)
    try {
      const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING'] as const;
      const packInventory = await prisma.packInventory.findMany({
        where: { packId: booking.packId },
        include: { item: true },
      });

      for (const row of packInventory) {
        const overlapping = await prisma.bookingInventory.count({
          where: {
            itemId: row.itemId,
            bookingId: { not: booking.id },
            booking: { status: { in: ACTIVE_BOOKING_STATUSES as any } },
          },
        });
        if (overlapping > 0) continue;

        await prisma.bookingInventory.upsert({
          where: { bookingId_itemId: { bookingId: booking.id, itemId: row.itemId } },
          create: {
            bookingId: booking.id,
            itemId: row.itemId,
            quantity: Math.max(1, Number(row.quantity || 1)),
            conditionBefore: row.item.condition,
          },
          update: {
            quantity: Math.max(1, Number(row.quantity || 1)),
          },
        });
      }
    } catch (assignError) {
      log.warn('No s’ha pogut auto-assignar inventari del pack a la reserva', {
        context: {
          bookingId: booking.id,
          packId: booking.packId,
          error: assignError instanceof Error ? assignError.message : String(assignError),
        },
      });
    }

    if (linkedCustomerId) {
      await prisma.customerActivity.create({
        data: {
          customerId: linkedCustomerId,
          action: 'BOOKING_CREATED',
          details: {
            bookingId: booking.id,
            reference: booking.reference,
            eventDate: booking.eventDate,
            eventType: booking.eventType,
            status: booking.status,
          },
        },
      });

      const prepDueDate = new Date(booking.eventDate);
      prepDueDate.setDate(prepDueDate.getDate() - 7);

      await prisma.task.create({
        data: {
          customerId: linkedCustomerId,
          bookingId: booking.id,
          leadId: data.leadId || null,
          title: `Preparar reserva ${booking.reference}`,
          description: 'Revisa horaris, ubicació, inventari, extres i confirmació final amb client.',
          dueDate: prepDueDate,
          status: 'OPEN',
          priority: 'HIGH',
          createdBy: 'system:auto-booking-create',
        },
      });
    }

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
    log.error('Error creant reserva:', error, {
      context: {
        requestId,
        endpoint: 'admin/bookings:POST',
        customerId: customerIdForLog,
      },
    });
    return NextResponse.json(
      { error: 'Error creant reserva' },
      { status: 500 }
    );
  }
}
