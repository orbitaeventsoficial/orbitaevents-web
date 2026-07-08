import { EventType } from '@prisma/client';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { CUSTOMER_ACTIVITY_ACTIONS, TASK_SOURCE } from '@/lib/constants';
import { recordCustomerBookingCreated } from '@/lib/services/customerActivityService';
import { DEFAULT_VEHICLE_COST_PER_KM, sanitizeNonNegative } from '@/lib/services/travelCost';
import { computeBoloTransport } from '@/lib/services/travelLaborCost';
import { getFuelCostPerKmReference } from '@/lib/services/fuelReferenceService';
import { calculateGoogleMapsDistance } from '@/lib/services/googleMapsDistance';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/constants';
import { calcVatRate, calcDeposit, roundMoney, CUSTOM_BOOKING_PACK_SLUG, CUSTOM_BOOKING_PACK_MARKER } from '@/lib/constants/pricing';
import { calculateEventDuration } from '@/lib/inventory-utils';
import { SOUND_RENTAL } from '@/lib/constants/inventory';
import { sendBookingConfirmationEmail } from '@/lib/services/bookingConfirmationEmailService';
import { DEFAULT_BOOKING_PAYMENT_METHOD } from '@/lib/constants/booking-payment';
import { sanitizeRevenueAmount, sanitizeServiceLineCostAmount } from '@/lib/services/serviceLineCostRules';

/**
 * Imputa el so d'Isma com a cost inclos dins el DJ. No es factura a part i no
 * depen del cataleg de proveidors: si el bolo porta pack o linia DJ, 50 eur del
 * preu DJ es liquiden a Isma.
 */
async function appendSoundRentalLine(
  lines: ReturnType<typeof normalizeServiceLines>,
  hasPack: boolean,
) {
  const hasDjLine = lines.some((l) => {
    const label = (l.label ?? '').toLowerCase();
    return (l.revenueAmount || 0) > 0 && (l.kind === 'DJ' || /\bdj\b/.test(label));
  });
  if (!SOUND_RENTAL.enabled || (!hasPack && !hasDjLine)) return lines;
  const alreadyHasSound = lines.some(
    (l) => {
      const label = (l.label ?? '').toLowerCase();
      return Boolean(
        l.notes?.includes(SOUND_RENTAL.notesMarker) ||
        (l.collaboratorId === SOUND_RENTAL.collaboratorId && /so|altaveu|speaker/.test(label)) ||
        (l.kind === 'EQUIPMENT' && label.includes('so')),
      );
    },
  );
  if (alreadyHasSound) return lines;
  const rental = await prisma.collaborator.findFirst({
    where: {
      OR: [
        { id: SOUND_RENTAL.collaboratorId },
        { name: SOUND_RENTAL.collaboratorName, roles: { has: 'EQUIPMENT_RENTAL' } },
      ],
    },
    select: { id: true },
  });
  if (!rental) return lines;
  return [
    ...lines,
    {
      collaboratorId: rental.id,
      sortOrder: lines.length,
      partyType: null,
      kind: 'EQUIPMENT' as const,
      label: SOUND_RENTAL.label,
      revenueAmount: 0,
      costAmount: SOUND_RENTAL.costPerEvent,
      quantity: 1,
      hours: null,
      notes: `${SOUND_RENTAL.notesMarker} Cost inclos dins el preu del DJ; no es factura a part al client.`,
    },
  ];
}

const OPERATOR_EXTRA_ID = '__operator_extra__';
const OPERATOR_EXTRA_SLUG = 'operator-support-hour';

/**
 * Pack tècnic "Personalitzat" (preu 0, 0h, sense inventari) per a bolos muntats
 * per línies de servei sense triar un pack de catàleg. Idempotent per slug.
 * Mateix patró que ensureOperatorSupportExtraId. NO és visible al catàleg públic
 * (isActive false) ni a la graella de packs (filtrat per slug).
 */
async function ensureCustomBookingPackId(): Promise<string> {
  const existing = await prisma.pack.findUnique({
    where: { slug: CUSTOM_BOOKING_PACK_SLUG },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.pack.create({
    data: {
      slug: CUSTOM_BOOKING_PACK_SLUG,
      price: 0,
      djHours: 0,
      extraHourPrice: 0,
      soundWatts: 0,
      includesFog: false,
      isActive: false,
      translations: {
        create: [
          { locale: 'ca', name: 'Personalitzat', description: 'Bolo muntat a mida per serveis i productes' },
          { locale: 'es', name: 'Personalizado', description: 'Bolo a medida por servicios y productos' },
          { locale: 'en', name: 'Custom', description: 'Custom booking built from services and products' },
        ],
      },
    },
    select: { id: true },
  });
  return created.id;
}

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
  tollsEur?: number;
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

function normalizeBookingExtras(extras?: BookingExtraInput[]) {
  if (!Array.isArray(extras)) return [];

  return extras.map((extra) => ({
    extraId: extra.extraId,
    quantity: typeof extra.quantity === 'number' && extra.quantity > 0 ? Math.floor(extra.quantity) : 1,
    price: sanitizeMoney(extra.price) ?? 0,
  }));
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
      revenueAmount: sanitizeRevenueAmount(line.revenueAmount),
      costAmount: sanitizeServiceLineCostAmount({ kind: line.kind || 'OTHER', label: line.label, costAmount: line.costAmount }),
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

  let leadBoloLines: BookingServiceLineInput[] = [];
  if (data.leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: data.leadId },
      select: {
        customerId: true,
        sourceCollaboratorId: true,
        serviceLines: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { collaboratorId: true, kind: true, label: true, revenueAmount: true, costAmount: true, quantity: true, hours: true, partyType: true, notes: true },
        },
      },
    });
    if (!linkedCustomerId) {
      linkedCustomerId = lead?.customerId || null;
    }
    sourceCollaboratorId = sourceCollaboratorId || lead?.sourceCollaboratorId || null;
    leadBoloLines = (lead?.serviceLines || []).map((l) => ({
      collaboratorId: l.collaboratorId || undefined,
      kind: l.kind,
      label: l.label,
      revenueAmount: l.revenueAmount ?? undefined,
      costAmount: l.costAmount ?? undefined,
      quantity: l.quantity ?? undefined,
      hours: l.hours ?? undefined,
      partyType: l.partyType ?? undefined,
      notes: l.notes ?? undefined,
    }));
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

  // Bolo personalitzat (sense pack de catàleg): resol el pack tècnic 0€.
  const hasCatalogPack = Boolean(data.packId && data.packId !== CUSTOM_BOOKING_PACK_MARKER);
  const resolvedPackId = (data.packId === CUSTOM_BOOKING_PACK_MARKER || !data.packId)
    ? await ensureCustomBookingPackId()
    : data.packId;
  const pack = await prisma.pack.findUnique({ where: { id: resolvedPackId } });
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
  const normalizedExtras = normalizeBookingExtras(data.extras);
  const resolvedExtras = normalizedExtras.length > 0
    ? (await Promise.all(
        normalizedExtras.map(async (extra) => {
          const resolvedId = await resolveExtraId(extra.extraId);
          if (!resolvedId) return null;
          return {
            extraId: resolvedId,
            quantity: extra.quantity,
            price: extra.price,
          };
        })
      )).filter((extra): extra is { extraId: string; quantity: number; price: number } => extra !== null)
    : [];
  const extrasPrice = resolvedExtras.reduce((sum, e) => sum + e.price * e.quantity, 0);
  // Si el payload no porta línies però el lead té un bolo muntat, s'hereten (Fase 2).
  const serviceLinesBase = normalizeServiceLines(
    (data.serviceLines && data.serviceLines.length > 0) ? data.serviceLines : leadBoloLines
  );
  // So Isma inclos dins el DJ: cost real sense producte extra client-facing.
  const serviceLines = await appendSoundRentalLine(serviceLinesBase, hasCatalogPack);
  const serviceLinesRevenue = serviceLines.reduce(
    (sum, line) => sum + (line.revenueAmount || 0) * (line.quantity || 1),
    0
  );
  // El pack, les hores extra, els extres i les línies de servei se SUMEN tots
  // (les línies són serveis addicionals, no substitueixen el pack). El total
  // manual (manualTotalPrice), si s'informa, guanya sobre aquest càlcul més avall.
  const subtotalBase = packPrice + extraHoursPrice + extrasPrice + serviceLinesRevenue;

  let distanceKm = data.distanceKm != null ? sanitizeNonNegative(data.distanceKm, 0) : null;
  let autoTollsEur: number | null = null;
  if (distanceKm == null) {
    const destination = [data.eventVenue || '', data.eventLocation || ''].filter(Boolean).join(', ').trim();
    if (destination) {
      try {
        const route = await calculateGoogleMapsDistance({ destination });
        distanceKm = sanitizeNonNegative(route.roundTripKm, 0);
        autoTollsEur = route.tollsEur; // peatges automàtics (#1373) si Google en dona
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
  // Peatges: manual (data.tollsEur) prioritari; si no, els automàtics de Google (#1373).
  const tollsEur = data.tollsEur != null ? sanitizeNonNegative(data.tollsEur, 0) : (autoTollsEur ?? 0);
  // Transport (#1369, monocapa): UNA crida al cervell econòmic. `cost` = cost intern real
  // (cotxe + tripulació + peatges); `clientCharge` = el que paga el client (amb franquícia
  // de 50 km i peatges). El headcount surt de les línies del bolo.
  const transport = distanceKm != null
    ? computeBoloTransport({ roundTripKm: distanceKm, serviceLines, hasOrbitaPack: packPrice > 0, tollsEur, vehicleCostPerKm: fuelCostPerKm })
    : null;
  const travelCost = transport ? transport.cost : null;
  const travelCharge = transport ? transport.clientCharge : 0;
  const subtotalCalculated = subtotalBase + travelCharge;
  const discount = sanitizeMoney(data.discount) ?? 0;
  const invoiceRequired = Boolean(data.invoiceRequired);
  const vatRate = calcVatRate(invoiceRequired);
  const manualTotal = data.manualTotalPrice != null && data.manualTotalPrice > 0
    ? roundMoney(data.manualTotalPrice)
    : null;
  const subtotal = manualTotal !== null
    ? invoiceRequired
      ? roundMoney(manualTotal * 100 / (100 + vatRate))
      : manualTotal
    : subtotalCalculated;
  const baseAfterDiscount = manualTotal !== null ? subtotal : Math.max(0, subtotal - discount);
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
      packId: resolvedPackId,
      extraHours,
      distanceKm,
      tollsEur: tollsEur > 0 ? tollsEur : null,
      fuelCostPerKm,
      travelCost,
      subtotal,
      discount: manualTotal !== null ? 0 : discount,
      discountCode: data.discountCode,
      invoiceRequired,
      vatRate,
      vatAmount,
      total,
      depositAmount,
      remainingAmount: Math.round((total - depositAmount) * 100) / 100,
      paymentMethod: DEFAULT_BOOKING_PAYMENT_METHOD,
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

  // Confirmació al client (plantilla editable booking_confirmation). No bloqueja la
  // creació si l'enviament falla: la reserva ja està desada.
  const confirmationEmail = billedPartner?.email || data.clientEmail;
  if (confirmationEmail) {
    const sent = await sendBookingConfirmationEmail({
      to: confirmationEmail,
      locale: null,
      reference: booking.reference,
      clientName: data.clientName,
      eventDate,
      startTime: data.eventStartTime,
      endTime: data.eventEndTime,
      packId: resolvedPackId,
      location: data.eventLocation,
      total,
      depositAmount,
    });
    if (!sent.ok) {
      log.error('Confirmació de reserva no enviada', undefined, {
        context: { reference: booking.reference, reason: sent.error },
      });
    }
  }

  return { status: 200, body: { ok: true, booking } };
}
