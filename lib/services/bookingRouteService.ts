import { BOOKING_CALENDAR_SYNC_FIELDS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { BookingStatus, EventType } from '@prisma/client';
import { calculateTravelCharge, calculateTravelCost, DEFAULT_VEHICLE_COST_PER_KM, sanitizeNonNegative } from '@/lib/services/travelCost';
import { getFuelCostPerKmReference } from '@/lib/services/fuelReferenceService';
import { calculateGoogleMapsDistance } from '@/lib/services/googleMapsDistance';
import { applyBookingStatusSideEffects, type ManagedBookingStatus } from '@/lib/services/bookingStatusTransitionService';
import { syncBookingToGoogleCalendar } from '@/lib/services/googleCalendarSyncService';

type ExistingBookingRecord = {
  id: string;
  customerId: string | null;
  status: ManagedBookingStatus;
  subtotal: number;
  discount: number | null;
  vatRate: number | null;
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
};

export async function getBookingDetail(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      pack: { include: { translations: true, inventory: { include: { item: true } } } },
      extras: { include: { extra: { include: { translations: true } } } },
      inventory: { include: { item: true } },
      lead: true,
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
  const syncSensitiveFields = new Set<string>(BOOKING_CALENDAR_SYNC_FIELDS);
  const shouldSyncCalendar = Object.keys(body).some((key) => syncSensitiveFields.has(key));

  if (body.eventDate && typeof body.eventDate === 'string') body.eventDate = new Date(body.eventDate);
  if (body.depositPaidAt && typeof body.depositPaidAt === 'string') body.depositPaidAt = new Date(body.depositPaidAt);
  if (body.remainingPaidAt && typeof body.remainingPaidAt === 'string') body.remainingPaidAt = new Date(body.remainingPaidAt);
  if (typeof body.startTime === 'string') body.eventStartTime = body.startTime;
  if (typeof body.endTime === 'string') body.eventEndTime = body.endTime;
  if (typeof body.totalPrice === 'number') body.total = body.totalPrice;
  delete body.startTime;
  delete body.endTime;
  delete body.totalPrice;
  delete body.internalNotes;

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
    const vatRate = typeof body.vatRate === 'number' ? body.vatRate : existing.vatRate || 21;
    const baseAfterDiscount = Math.max(0, subtotal - discount);
    const vatAmount = baseAfterDiscount * (vatRate / 100);
    const total = baseAfterDiscount + vatAmount;

    body.subtotal = subtotal;
    body.vatAmount = vatAmount;
    body.total = total;
    body.depositAmount = Math.round(total * 0.3);
    body.remainingAmount = total - Math.round(total * 0.3);
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
  const booking = await prisma.booking.update({
    where: { id },
    data: prepared.body,
  });

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





