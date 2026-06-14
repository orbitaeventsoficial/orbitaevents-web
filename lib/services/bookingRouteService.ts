import { BOOKING_CALENDAR_SYNC_FIELDS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { BookingStatus, EventType } from '@prisma/client';
import { calculateTravelCharge, calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM, sanitizeNonNegative } from '@/lib/services/travelCost';
import { getFuelCostPerKmReference } from '@/lib/services/fuelReferenceService';
import { calculateGoogleMapsDistance } from '@/lib/services/googleMapsDistance';
import { applyBookingStatusSideEffects, type ManagedBookingStatus } from '@/lib/services/bookingStatusTransitionService';
import { syncBookingToGoogleCalendar } from '@/lib/services/googleCalendarSyncService';
import { mapAdminLogToCanonicalEvent } from '@/lib/services/timelineQueryService';
import { VAT_RATE_INVOICE, VAT_RATE_NO_INVOICE, calcDeposit, roundMoney } from '@/lib/constants/pricing';

type ExistingBookingRecord = {
  id: string;
  customerId: string | null;
  leadId: string | null;
  status: ManagedBookingStatus;
  subtotal: number;
  discount: number | null;
  vatRate: number | null;
  invoiceRequired: boolean | null;
  distanceKm: number | null;
  fuelCostPerKm: number | null;
  guestCount: number | null;
  eventType: EventType;
  eventLocation: string;
  eventVenue: string | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  reference: string;
  preferredLocale: string | null;
  clientEmail: string | null;
  clientName: string;
  clientPhone: string | null;
  eventPhone: string | null;
  eventAddress: string | null;
};

type BookingServiceLinePatchInput = {
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

function sanitizeMoney(value?: number | null): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value * 100) / 100);
}

function normalizeServiceLines(lines: BookingServiceLinePatchInput[]) {
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

function serviceLinesRevenue(lines: Array<{ revenueAmount?: number | null; quantity?: number | null }>) {
  return lines.reduce((sum, line) => sum + Number(line.revenueAmount || 0) * (line.quantity || 1), 0);
}

async function applyServiceLineTotalDelta(
  existing: ExistingBookingRecord,
  preparedBody: Record<string, unknown>,
  inputLines: BookingServiceLinePatchInput[],
) {
  if (Object.prototype.hasOwnProperty.call(preparedBody, 'total')) return;

  const oldLines = await prisma.bookingServiceLine.findMany({
    where: { bookingId: existing.id },
    select: { revenueAmount: true, quantity: true },
  });
  const nextLines = normalizeServiceLines(inputLines);
  const delta = roundMoney(serviceLinesRevenue(nextLines) - serviceLinesRevenue(oldLines));
  if (delta === 0) return;

  const subtotal = roundMoney(Number(preparedBody.subtotal ?? existing.subtotal) + delta);
  const discount = Number(preparedBody.discount ?? existing.discount ?? 0);
  const invoiceRequired = Object.prototype.hasOwnProperty.call(preparedBody, 'invoiceRequired')
    ? Boolean(preparedBody.invoiceRequired)
    : Boolean(existing.invoiceRequired);
  const vatRate = typeof preparedBody.vatRate === 'number'
    ? preparedBody.vatRate
    : invoiceRequired ? VAT_RATE_INVOICE : VAT_RATE_NO_INVOICE;
  const baseAfterDiscount = Math.max(0, subtotal - discount);
  const vatAmount = roundMoney(baseAfterDiscount * (vatRate / 100));
  const total = roundMoney(baseAfterDiscount + vatAmount);
  const depositAmount = calcDeposit(total);

  preparedBody.subtotal = subtotal;
  preparedBody.vatRate = vatRate;
  preparedBody.vatAmount = vatAmount;
  preparedBody.total = total;
  preparedBody.depositAmount = depositAmount;
  preparedBody.remainingAmount = roundMoney(total - depositAmount);
}

export async function getBookingDetail(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      pack: { include: { translations: true, inventory: { include: { item: true } } } },
      extras: { include: { extra: { include: { translations: true } } } },
      inventory: { include: { item: true } },
      lead: true,
      billedCollaborator: true,
      serviceLines: {
        include: { collaborator: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      postEventReport: true,
      clientSurvey: true,
      clientFeedback: true,
    },
  });

  if (!booking) {
    return { status: 404, body: { error: 'Reserva no trobada' } };
  }

  return { status: 200, body: { ok: true, booking } };
}

export async function prepareBookingPatchData(existing: ExistingBookingRecord, input: Record<string, unknown>) {
  const body: Record<string, unknown> = { ...input };
  delete body.serviceLines;
  const shouldSyncCalendar = Object.keys(body).some((key) => (BOOKING_CALENDAR_SYNC_FIELDS as readonly string[]).includes(key));

  if (body.eventDate && typeof body.eventDate === 'string') body.eventDate = new Date(body.eventDate);
  if (body.depositPaidAt && typeof body.depositPaidAt === 'string') body.depositPaidAt = new Date(body.depositPaidAt);
  if (body.remainingPaidAt && typeof body.remainingPaidAt === 'string') body.remainingPaidAt = new Date(body.remainingPaidAt);
  if (typeof body.startTime === 'string') body.eventStartTime = body.startTime;
  if (typeof body.endTime === 'string') body.eventEndTime = body.endTime;
  // Preu pactat manual: és el total final que paga el client
  const manualTotalPrice = typeof input.totalPrice === 'number' ? (input.totalPrice as number) : null;
  delete body.totalPrice;
  delete body.startTime;
  delete body.endTime;
  delete body.internalNotes;

  const invoiceFieldTouched = Object.prototype.hasOwnProperty.call(body, 'invoiceRequired');
  const fiscalRecalcNeeded = manualTotalPrice !== null || invoiceFieldTouched;

  if (fiscalRecalcNeeded && !Object.prototype.hasOwnProperty.call(body, 'distanceKm')) {
    // Determina invoiceRequired definitiu
    const invoiceRequired = invoiceFieldTouched
      ? Boolean(body.invoiceRequired)
      : Boolean(existing.invoiceRequired);
    const vatRate = invoiceRequired ? VAT_RATE_INVOICE : VAT_RATE_NO_INVOICE;

    if (manualTotalPrice !== null) {
      // Preu pactat: el total és exactament el que l'usuari escriu
      const total = roundMoney(manualTotalPrice);
      // Subtotal = total sense IVA (back-calculate si hi ha factura)
      const subtotal = invoiceRequired
        ? roundMoney(total * 100 / (100 + vatRate))
        : total;
      const vatAmount = roundMoney(total - subtotal);
      const depositAmount = calcDeposit(total);
      body.subtotal  = subtotal;
      body.vatRate   = vatRate;
      body.vatAmount = vatAmount;
      body.total     = total;
      body.depositAmount   = depositAmount;
      body.remainingAmount = roundMoney(total - depositAmount);
    } else {
      // Només ha canviat invoiceRequired — recalcula des del subtotal existent
      const subtotal = Number(existing.subtotal);
      const discount = Number(existing.discount ?? 0);
      const baseAfterDiscount = Math.max(0, subtotal - discount);
      const vatAmount = roundMoney(baseAfterDiscount * (vatRate / 100));
      const total = roundMoney(baseAfterDiscount + vatAmount);
      const depositAmount = calcDeposit(total);
      body.vatRate   = vatRate;
      body.vatAmount = vatAmount;
      body.total     = total;
      body.depositAmount   = depositAmount;
      body.remainingAmount = roundMoney(total - depositAmount);
    }
  }

  const locationFieldTouched = Object.prototype.hasOwnProperty.call(body, 'eventLocation') || Object.prototype.hasOwnProperty.call(body, 'eventVenue');
  if (locationFieldTouched && !Object.prototype.hasOwnProperty.call(body, 'distanceKm')) {
    const destination = [
      typeof body.eventVenue === 'string' ? body.eventVenue : (existing.eventVenue || ''),
      typeof body.eventLocation === 'string' ? body.eventLocation : existing.eventLocation,
    ].filter(Boolean).join(', ').trim();

    if (destination) {
      try {
        const route = await calculateGoogleMapsDistance({ destination });
        body.distanceKm = sanitizeNonNegative(route.roundTripKm, 0);
      } catch (err) { log.error('[bookingRoute] Google Maps distance failed:', err); }
    }
  }

  const travelFieldTouched = Object.prototype.hasOwnProperty.call(body, 'distanceKm') || Object.prototype.hasOwnProperty.call(body, 'fuelCostPerKm') || Object.prototype.hasOwnProperty.call(body, 'travelCost');
  if (travelFieldTouched) {
    const fuelReference = await getFuelCostPerKmReference();
    const distanceKm = Object.prototype.hasOwnProperty.call(body, 'distanceKm')
      ? sanitizeNonNegative(body.distanceKm as number, 0)
      : sanitizeNonNegative(existing.distanceKm ?? 0, 0);
    const fuelCostPerKm = Object.prototype.hasOwnProperty.call(body, 'fuelCostPerKm')
      ? sanitizeNonNegative(body.fuelCostPerKm as number, fuelReference.costPerKm)
      : sanitizeNonNegative(existing.fuelCostPerKm ?? fuelReference.costPerKm, DEFAULT_VEHICLE_COST_PER_KM);

    body.distanceKm = distanceKm;
    body.fuelCostPerKm = fuelCostPerKm;
    body.travelCost = calculateTravelCost(distanceKm, fuelCostPerKm);

    const travelCharge = calculateTravelCharge(distanceKm);
    const baseWithoutTravel = Math.max(0, existing.subtotal - calculateTravelCharge(existing.distanceKm || 0));
    const subtotal = baseWithoutTravel + travelCharge;
    const discount = typeof body.discount === 'number' ? body.discount : existing.discount || 0;
    const invoiceReq = Object.prototype.hasOwnProperty.call(body, 'invoiceRequired')
      ? Boolean(body.invoiceRequired)
      : Boolean(existing.invoiceRequired);
    const vatRate = typeof body.vatRate === 'number'
      ? body.vatRate
      : invoiceReq ? VAT_RATE_INVOICE : VAT_RATE_NO_INVOICE;
    const baseAfterDiscount = Math.max(0, subtotal - discount);
    const vatAmount = roundMoney(baseAfterDiscount * (vatRate / 100));
    const total = roundMoney(baseAfterDiscount + vatAmount);
    const depositAmount = calcDeposit(total);

    body.subtotal = subtotal;
    body.vatAmount = vatAmount;
    body.total = total;
    body.depositAmount = depositAmount;
    body.remainingAmount = roundMoney(total - depositAmount);
  }

  const oldStatus = existing.status as ManagedBookingStatus;
  const newStatus = body.status as ManagedBookingStatus | undefined;
  const { statsUpdated } = newStatus
    ? await applyBookingStatusSideEffects({
        bookingId: existing.id,
        oldStatus,
        newStatus,
        existing: {
          guestCount: existing.guestCount || 0,
          eventType: existing.eventType,
          eventLocation: existing.eventLocation,
          eventStartTime: existing.eventStartTime,
          eventEndTime: existing.eventEndTime,
          reference: existing.reference,
          preferredLocale: existing.preferredLocale,
          clientEmail: existing.clientEmail,
          clientName: existing.clientName,
        },
        portalTrigger: 'status_completed',
      })
    : { statsUpdated: false };

  return { body, shouldSyncCalendar, oldStatus, newStatus, statsUpdated };
}

export async function updateBookingDetail(id: string, input: Record<string, unknown>) {
  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return { status: 404, body: { error: 'Reserva no trobada' } };
  }

  const prepared = await prepareBookingPatchData(existing, input);
  if (Array.isArray(input.serviceLines)) {
    await applyServiceLineTotalDelta(existing, prepared.body, input.serviceLines as BookingServiceLinePatchInput[]);
  }
  const booking = await prisma.booking.update({
    where: { id },
    data: prepared.body,
  });

  if (Array.isArray(input.serviceLines)) {
    const serviceLines = normalizeServiceLines(input.serviceLines as BookingServiceLinePatchInput[]);
    await prisma.bookingServiceLine.deleteMany({ where: { bookingId: id } });
    if (serviceLines.length > 0) {
      await prisma.bookingServiceLine.createMany({
        data: serviceLines.map((line) => ({ ...line, bookingId: id })),
      });
    }
  }

  // Sincronització canònica: si s'actualitzen dades de contacte i hi ha client vinculat,
  // propagar els canvis al customer (font de veritat).
  if (existing.customerId) {
    const customerPatch: Record<string, unknown> = {};
    if (typeof input.clientEmail === 'string' && input.clientEmail !== existing.clientEmail) {
      customerPatch.email = input.clientEmail;
      customerPatch.emailNormalized = input.clientEmail.toLowerCase().trim();
    }
    if (typeof input.clientPhone === 'string' && input.clientPhone !== (existing as { clientPhone?: string }).clientPhone) {
      customerPatch.phone = input.clientPhone;
    }
    if (typeof input.clientName === 'string' && input.clientName !== existing.clientName) {
      customerPatch.name = input.clientName;
      customerPatch.nameNormalized = input.clientName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }
    if (Object.keys(customerPatch).length > 0) {
      await prisma.customer.update({ where: { id: existing.customerId }, data: customerPatch });
    }
  }

  if (existing.leadId) {
    const leadPatch: Record<string, unknown> = {};
    const syncKeys = [
      'eventDate',
      'eventStartTime',
      'eventEndTime',
      'eventLocation',
      'eventPhone',
      'eventAddress',
      'guestCount',
      'eventType',
      'sourceCollaboratorId',
    ] as const;

    for (const key of syncKeys) {
      if (Object.prototype.hasOwnProperty.call(prepared.body, key)) {
        leadPatch[key] = prepared.body[key];
      }
    }

    if (Object.keys(leadPatch).length > 0) {
      await prisma.lead.update({
        where: { id: existing.leadId },
        data: leadPatch,
      });
    }
  }

  const calendarSync = prepared.shouldSyncCalendar ? await syncBookingToGoogleCalendar(id) : null;

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'booking',
      entityId: id,
      details: {
        changes: Object.keys(prepared.body),
        statusChange: prepared.newStatus !== prepared.oldStatus ? `${prepared.oldStatus} → ${prepared.newStatus}` : undefined,
      },
    },
  });

  return {
    status: 200,
    body: {
      ok: true,
      booking,
      statsUpdated: prepared.statsUpdated,
      calendarSync,
    },
    customerId: existing.customerId,
  };
}

export async function changeBookingStatus(id: string, status: ManagedBookingStatus) {
  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) {
    return { status: 404, body: { error: 'Reserva no trobada' } };
  }

  const oldStatus = existing.status as ManagedBookingStatus;
  const { statsUpdated } = await applyBookingStatusSideEffects({
    bookingId: id,
    oldStatus,
    newStatus: status,
    existing: {
      guestCount: existing.guestCount || 0,
      eventType: existing.eventType,
      eventLocation: existing.eventLocation,
      eventStartTime: existing.eventStartTime,
      eventEndTime: existing.eventEndTime,
      reference: existing.reference,
      preferredLocale: existing.preferredLocale,
      clientEmail: existing.clientEmail,
      clientName: existing.clientName,
    },
    portalTrigger: 'status_completed_kanban',
  });

  const booking = await prisma.booking.update({ where: { id }, data: { status } });
  const calendarSync = await syncBookingToGoogleCalendar(id);

  await prisma.adminLog.create({
    data: {
      action: 'UPDATE',
      entity: 'booking',
      entityId: id,
      details: { statusChange: `${oldStatus} → ${status}`, statsUpdated },
    },
  });

  return { status: 200, body: { ok: true, booking, previousStatus: oldStatus, newStatus: status, statsUpdated, calendarSync } };
}

export async function deleteBookingIfAllowed(existing: Pick<ExistingBookingRecord, 'id' | 'status' | 'reference'>) {
  if (existing.status !== BookingStatus.PENDING && existing.status !== BookingStatus.CANCELLED) {
    return { ok: false as const, status: 400, body: { error: 'Només es poden eliminar reserves pendents o cancel·lades' } };
  }

  await prisma.availability.updateMany({ where: { bookingId: existing.id }, data: { status: 'AVAILABLE', bookingId: null } });
  await prisma.bookingExtra.deleteMany({ where: { bookingId: existing.id } });
  await prisma.booking.delete({ where: { id: existing.id } });
  await prisma.adminLog.create({ data: { action: 'DELETE', entity: 'booking', entityId: existing.id, details: { reference: existing.reference } } });

  return { ok: true as const, status: 200, body: { ok: true } };
}
