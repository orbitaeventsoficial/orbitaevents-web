import { EventType } from '@prisma/client';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { CUSTOMER_ACTIVITY_ACTIONS, TASK_SOURCE } from '@/lib/constants';
import { recordCustomerBookingCreated } from '@/lib/services/customerActivityService';
import { calculateTravelCharge, calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM, sanitizeNonNegative } from '@/lib/services/travelCost';
import { getFuelCostPerKmReference } from '@/lib/services/fuelReferenceService';
import { calculateGoogleMapsDistance } from '@/lib/services/googleMapsDistance';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';
import { calcVatRate, calcDeposit, roundMoney } from '@/lib/constants/pricing';
import { calculateEventDuration } from '@/lib/inventory-utils';

const OPERATOR_EXTRA_ID = '__operator_extra__';
const OPERATOR_EXTRA_SLUG = 'operator-support-hour';

function normalizeEventType(eventType: string): EventType {
  return Object.values(EventType).includes(eventType as EventType) ? (eventType as EventType) : EventType.OTHER;
}


type BookingExtraInput = {
  extraId: string;
  quantity?: number;
  price: number;
};

type BookingServiceLineInput = {
  collaboratorId?: string | null;
  sortOrder?: number;
  partyType?: string | null;
  kind?: 'DJ' | 'SOUND_TECH' | 'PROVIDER_SERVICE' | 'EQUIPMENT' | 'OTHER';
  label: string;
  revenueAmount?: number | null;
  costAmount?: number | null;
  quantity?: number | null;
  hours?: number | null;
  notes?: string | null;
};

type BookingCreateInput = {
  leadId?: string;
  customerId?: string;
  sourceCollaboratorId?: string | null;
  billedCollaboratorId?: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventLocation: string;
  eventVenue?: string;
  guestCount: number;
  packId: string;
  customPackPrice?: number;
  manualTotalPrice?: number;
  invoiceRequired?: boolean;
  extraHours?: number;
  extras?: BookingExtraInput[];
  discount?: number;
  discountCode?: string;
  notes?: string;
  distanceKm?: number;
  fuelCostPerKm?: number;
  travelCost?: number;
  serviceLines?: BookingServiceLineInput[];
};

type BookingCreationResult = {
  status: number;
  body: Record<string, unknown>;
};

async function generateReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `OE-${year}-`;

  const MAX_ATTEMPTS = 3;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const lastBooking = await prisma.booking.findFirst({
      where: { reference: { startsWith: prefix } },
      orderBy: { reference: 'desc' },
    });

    let nextNumber = 1;
    if (lastBooking) {
      const raw = lastBooking.reference.split('-').pop();
      const lastNumber = Number.parseInt(raw || '0', 10) || 0;
      nextNumber = lastNumber + 1 + attempt; // offset per retry
    }

    const candidate = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    // Verificar que no existeix (protecció contra race condition)
    const exists = await prisma.booking.findUnique({
      where: { reference: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }

  // Fallback: afegir timestamp per garantir unicitat
  const ts = Date.now().toString(36);
  return `${prefix}${ts}`;
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

function deriveExtraHours(input: {
  explicitExtraHours?: number;
  eventStartTime?: string;
  eventEndTime?: string;
  packDjHours?: number | null;
}): number {
  if (typeof input.explicitExtraHours === 'number' && input.explicitExtraHours > 0) {
    return input.explicitExtraHours;
  }

  const packHours = Number(input.packDjHours || 0);
  if (packHours <= 0) return Math.max(0, input.explicitExtraHours || 0);

  const eventHours = calculateEventDuration(input.eventStartTime, input.eventEndTime);
  if (eventHours <= packHours) return Math.max(0, input.explicitExtraHours || 0);

  return Math.ceil((eventHours - packHours) * 10) / 10;
}

function sanitizeMoney(value?: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value * 100) / 100);
}

function normalizeServiceLines(lines?: BookingServiceLineInput[]) {
  if (!Array.isArray(lines)) return [];

  return lines
    .map((line, index) => ({
      collaboratorId: line.collaboratorId || null,
      sortOrder: typeof line.sortOrder === 'number' ? line.sortOrder : index,
      partyType: line.partyType?.trim() || null,
      kind: line.kind || 'OTHER',
      label: line.label?.trim(),
      revenueAmount: sanitizeMoney(line.revenueAmount),
      costAmount: sanitizeMoney(line.costAmount),
      quantity: typeof line.quantity === 'number' && line.quantity > 0 ? Math.floor(line.quantity) : null,
      hours: typeof line.hours === 'number' && line.hours > 0 ? Math.round(line.hours * 100) / 100 : null,
      notes: line.notes?.trim() || null,
    }))
    .filter((line) => Boolean(line.label));
}

async function resolveBilledPartner(id?: string | null) {
  if (!id) return null;
  return prisma.collaborator.findUnique({
    where: { id },
    select: { id: true, name: true, company: true, email: true, phone: true },
  });
}

async function assignPackInventory(bookingId: string, packId: string) {
  try {
    const packInventory = await prisma.packInventory.findMany({
      where: { packId },
      include: { item: true },
    });

    if (packInventory.length === 0) return;

    const itemIds = packInventory.map((r) => r.itemId);

    // Batch: trobar tots els items ja assignats a reserves actives
    const overlappingItems = await prisma.bookingInventory.groupBy({
      by: ['itemId'],
      where: {
        itemId: { in: itemIds },
        bookingId: { not: bookingId },
        booking: { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
      },
    });
    const busyItemIds = new Set(overlappingItems.map((o) => o.itemId));

    // Filtrar items disponibles
    const available = packInventory.filter((r) => !busyItemIds.has(r.itemId));

    // Batch upsert dels disponibles
    for (const row of available) {
      await prisma.bookingInventory.upsert({
        where: { bookingId_itemId: { bookingId, itemId: row.itemId } },
        create: {
          bookingId,
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
    log.warn('No s\'ha pogut auto-assignar inventari del pack a la reserva', {
      context: {
        bookingId,
        packId,
        error: assignError instanceof Error ? assignError.message : String(assignError),
      },
    });
  }
}

export async function createBookingFromInput(data: BookingCreateInput): Promise<BookingCreationResult> {
  let linkedCustomerId: string | null = data.customerId || null;
  let sourceCollaboratorId: string | null = data.sourceCollaboratorId || null;
  const billedPartner = await resolveBilledPartner(data.billedCollaboratorId || null);
  const billedCollaboratorId = billedPartner?.id || null;

  if (data.leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: data.leadId },
      select: { customerId: true, sourceCollaboratorId: true },
    });
    if (!linkedCustomerId) {
      linkedCustomerId = lead?.customerId || null;
    }
    sourceCollaboratorId = sourceCollaboratorId || lead?.sourceCollaboratorId || null;
  }

  if (billedCollaboratorId) {
    linkedCustomerId = null;
  } else if (!linkedCustomerId) {
    const byEmail = await prisma.customer.findUnique({
      where: { emailNormalized: data.clientEmail.trim().toLowerCase() },
      select: { id: true },
    });
    linkedCustomerId = byEmail?.id || null;
  }

  const pack = await prisma.pack.findUnique({ where: { id: data.packId } });
  if (!pack) {
    return { status: 404, body: { error: 'Pack no trobat' } };
  }

  const eventDate = new Date(data.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    return { status: 400, body: { error: 'Data de l\'esdeveniment invàlida' } };
  }

  const packPrice = data.customPackPrice != null && data.customPackPrice > 0
    ? data.customPackPrice
    : pack.price;
  const extraHours = deriveExtraHours({
    explicitExtraHours: data.extraHours,
    eventStartTime: data.eventStartTime,
    eventEndTime: data.eventEndTime,
    packDjHours: pack.djHours,
  });
  const extraHoursPrice = extraHours * pack.extraHourPrice;
  const extrasPrice = data.extras?.reduce((sum, e) => sum + e.price * (e.quantity || 1), 0) || 0;
  const serviceLines = normalizeServiceLines(data.serviceLines);
  const serviceLinesRevenue = serviceLines.reduce((sum, line) => sum + (line.revenueAmount || 0), 0);
  const subtotalBase = (serviceLinesRevenue > 0 ? serviceLinesRevenue : packPrice + extraHoursPrice) + extrasPrice;

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
  const fuelCostPerKm = sanitizeNonNegative(
    data.fuelCostPerKm ?? fuelReference.costPerKm,
    DEFAULT_VEHICLE_COST_PER_KM
  );
  const travelCost = distanceKm != null ? calculateTravelCost(distanceKm, fuelCostPerKm) : null;
  const travelCharge = distanceKm != null ? calculateTravelCharge(distanceKm) : 0;
  const subtotalCalculated = subtotalBase + travelCharge;
  const discount = data.discount || 0;
  const vatRate = calcVatRate(data.invoiceRequired ?? false);
  const manualTotal = data.manualTotalPrice != null && data.manualTotalPrice > 0
    ? roundMoney(data.manualTotalPrice)
    : null;
  const subtotal = manualTotal !== null
    ? data.invoiceRequired
      ? roundMoney(manualTotal * 100 / (100 + vatRate))
      : manualTotal
    : subtotalCalculated;
  const baseAfterDiscount = manualTotal !== null ? subtotal : subtotal - discount;
  // Money es desa com a Float al schema: arrodonir a cèntims evita soroll de
  // coma flotant a BD i desquadres amb Stripe (cobra en cèntims sencers).
  // Mateix patró canònic que publicBookingService.ts.
  const vatAmount = manualTotal !== null
    ? roundMoney(manualTotal - subtotal)
    : Math.round(baseAfterDiscount * (vatRate / 100) * 100) / 100;
  const total = manualTotal !== null
    ? manualTotal
    : Math.round((baseAfterDiscount + vatAmount) * 100) / 100;
  const depositAmount = calcDeposit(total);
  const reference = await generateReference();

  const resolvedExtras = data.extras
    ? (await Promise.all(
        data.extras.map(async (extra) => {
          const resolvedId = await resolveExtraId(extra.extraId);
          if (!resolvedId) return null;
          return {
            extraId: resolvedId,
            quantity: extra.quantity || 1,
            price: extra.price,
          };
        })
      )).filter((extra): extra is { extraId: string; quantity: number; price: number } => extra !== null)
    : [];

  const booking = await prisma.booking.create({
    data: {
      reference,
      leadId: data.leadId,
      customerId: linkedCustomerId,
      sourceCollaboratorId,
      billedCollaboratorId,
      clientName: billedPartner?.company || billedPartner?.name || data.clientName,
      clientEmail: billedPartner?.email || data.clientEmail,
      clientPhone: billedPartner?.phone || data.clientPhone,
      eventType: normalizeEventType(data.eventType),
      eventDate,
      eventStartTime: data.eventStartTime,
      eventEndTime: data.eventEndTime,
      eventLocation: data.eventLocation,
      eventVenue: data.eventVenue,
      guestCount: data.guestCount,
      packId: data.packId,
      extraHours,
      distanceKm,
      fuelCostPerKm,
      travelCost,
      subtotal,
      discount: manualTotal !== null ? 0 : discount,
      discountCode: data.discountCode,
      vatRate,
      vatAmount,
      total,
      depositAmount,
      remainingAmount: Math.round((total - depositAmount) * 100) / 100,
      notes: data.notes,
      extras: resolvedExtras.length > 0 ? { create: resolvedExtras } : undefined,
      serviceLines: serviceLines.length > 0 ? { create: serviceLines } : undefined,
    },
    include: {
      pack: true,
      extras: { include: { extra: true } },
    },
  });

  await assignPackInventory(booking.id, booking.packId);

  if (linkedCustomerId) {
    await recordCustomerBookingCreated({
      customerId: linkedCustomerId,
      bookingId: booking.id,
      reference: booking.reference,
      eventDate: booking.eventDate,
      eventType: booking.eventType,
      status: booking.status,
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
        source: TASK_SOURCE.BOOKING_CREATION,
      },
    });
  }

  if (data.leadId) {
    await prisma.lead.update({
      where: { id: data.leadId },
      data: {
        status: 'WON',
        convertedAt: new Date(),
        sourceCollaboratorId,
      },
    });
  }

  await prisma.availability.upsert({
    where: { date: eventDate },
    create: {
      date: eventDate,
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

  return { status: 200, body: { ok: true, booking } };
}
