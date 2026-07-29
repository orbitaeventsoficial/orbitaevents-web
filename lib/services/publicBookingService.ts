import { EventType, Prisma } from '@prisma/client';
import { sendBookingConfirmation, sendBookingNotificationToAdmin } from '@/lib/email';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { calcVatAmount, VAT_RATE_INVOICE, roundMoney } from '@/lib/constants/pricing';
import type { PublicBookingErrorCode } from '@/lib/public-booking-errors';
import { normalizePublicLocale } from '@/lib/public-locale';
import { recordCustomerBookingCreated } from '@/lib/services/customerActivityService';
import { normalizeEmail, normalizeName, normalizePhone } from '@/lib/utils/normalize';

type BookingExtraWithTranslations = Prisma.ExtraGetPayload<{ include: { translations: true } }>;
type BookingPackWithTranslations = Prisma.PackGetPayload<{ include: { translations: true } }>;

export interface PublicBookingRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  preferredLocale?: string;
  eventType: string;
  eventDate: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventLocation: string;
  eventVenue?: string;
  guestCount: number | string;
  packId: string;
  extraIds?: string[];
  extraHours?: number | string;
  notes?: string;
}

export interface PublicBookingResult {
  status: number;
  body: {
    success: boolean;
    error?: string;
    errorCode?: PublicBookingErrorCode;
    data?: {
      bookingId: string;
      reference: string;
      eventDate: Date;
      total: number;
    };
  };
}

class BookingError extends Error {
  code: 'DATE_UNAVAILABLE' | 'REFERENCE_CONFLICT';

  constructor(code: BookingError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `OE-${year}-${stamp}${random}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function resolvePublicBookingEventType(value: string): EventType | null {
  return Object.values(EventType).includes(value as EventType) ? (value as EventType) : null;
}

function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeRequiredPublicBookingString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalPublicBookingString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isValidPublicBookingEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function resolvePublicBookingGuestCount(value: unknown): number | null {
  const parsed = coerceFiniteNumber(value);
  return parsed !== null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function resolvePublicBookingExtraHours(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = coerceFiniteNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

function resolvePublicBookingEventDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildPublicBookingAvailabilityNote(clientName: string, reference?: string): string {
  return reference
    ? `Reserva pública pendent ${reference} · ${clientName}`
    : `Reserva pública pendent · ${clientName}`;
}

function isPastPublicBookingDate(eventDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

function publicBookingError(status: number, errorCode: PublicBookingErrorCode, error: string): PublicBookingResult {
  return {
    status,
    body: {
      success: false,
      error,
      errorCode,
    },
  };
}

export async function createPublicBooking(body: PublicBookingRequest): Promise<PublicBookingResult> {
  const clientName = normalizeRequiredPublicBookingString(body.clientName);
  const clientEmail = normalizeRequiredPublicBookingString(body.clientEmail)?.toLowerCase() ?? null;
  const clientPhone = normalizeRequiredPublicBookingString(body.clientPhone);
  const eventLocation = normalizeRequiredPublicBookingString(body.eventLocation);
  const packId = normalizeRequiredPublicBookingString(body.packId);

  if (!clientName || !clientEmail || !clientPhone || !eventLocation || !packId) {
    return publicBookingError(400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields');
  }

  if (!isValidPublicBookingEmail(clientEmail)) {
    return publicBookingError(400, 'INVALID_EMAIL', 'Invalid email format');
  }

  const eventType = resolvePublicBookingEventType(body.eventType);
  if (!eventType) {
    return publicBookingError(400, 'INVALID_EVENT_TYPE', 'Invalid event type selected');
  }

  const eventDate = resolvePublicBookingEventDate(body.eventDate);
  if (!eventDate) {
    return publicBookingError(400, 'INVALID_EVENT_DATE', 'Invalid event date');
  }

  if (isPastPublicBookingDate(eventDate)) {
    return publicBookingError(400, 'EVENT_DATE_PAST', 'Event date cannot be in the past');
  }

  const guestCount = resolvePublicBookingGuestCount(body.guestCount);
  if (guestCount === null) {
    return publicBookingError(400, 'INVALID_GUEST_COUNT', 'Invalid guest count');
  }

  const extraHours = resolvePublicBookingExtraHours(body.extraHours);
  if (extraHours === null) {
    return publicBookingError(400, 'INVALID_EXTRA_HOURS', 'Invalid extra hours');
  }

  const pack = await prisma.pack.findUnique({
    where: { id: packId },
    include: { translations: true },
  });

  if (!pack) {
    return publicBookingError(400, 'INVALID_PACK', 'Invalid pack selected');
  }

  let extras: BookingExtraWithTranslations[] = [];
  if (body.extraIds && body.extraIds.length > 0) {
    extras = await prisma.extra.findMany({
      where: { id: { in: body.extraIds } },
      include: { translations: true },
    });

    if (extras.length !== body.extraIds.length) {
      return publicBookingError(400, 'INVALID_EXTRAS', 'One or more extras are invalid.');
    }
  }

  let subtotal = pack.price;
  extras.forEach((extra) => {
    subtotal += extra.price;
  });

  if (extraHours > 0 && pack.extraHourPrice) {
    subtotal += pack.extraHourPrice * extraHours;
  }

  const discount = 0;
  const vatRate = VAT_RATE_INVOICE;
  const baseAfterDiscount = subtotal - discount;
  const vatAmount = calcVatAmount(baseAfterDiscount, true);
  const total = roundMoney(baseAfterDiscount + vatAmount);
  const preferredLocale = normalizePublicLocale(body.preferredLocale);
  const eventVenue = normalizeOptionalPublicBookingString(body.eventVenue);
  const notes = normalizeOptionalPublicBookingString(body.notes);
  const emailNormalized = normalizeEmail(clientEmail);
  const phoneNormalized = clientPhone ? normalizePhone(clientPhone) : null;
  const nameNormalized = normalizeName(clientName);

  const booking = await prisma.$transaction(async (tx) => {
    const availability = await tx.availability.findUnique({
      where: { date: eventDate },
    });

    if (availability && availability.status !== 'AVAILABLE') {
      throw new BookingError('DATE_UNAVAILABLE', 'Date is not available');
    }

    if (availability) {
      const updated = await tx.availability.updateMany({
        where: { date: eventDate, status: 'AVAILABLE' },
        data: { status: 'BOOKED', note: buildPublicBookingAvailabilityNote(clientName) },
      });

      if (updated.count === 0) {
        throw new BookingError('DATE_UNAVAILABLE', 'Date is not available');
      }
    } else {
      try {
        await tx.availability.create({
          data: {
            date: eventDate,
            status: 'BOOKED',
            note: buildPublicBookingAvailabilityNote(clientName),
          },
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new BookingError('DATE_UNAVAILABLE', 'Date is not available');
        }
        throw error;
      }
    }

    const customer = await tx.customer.upsert({
      where: { emailNormalized },
      update: {
        email: clientEmail,
        name: clientName,
        nameNormalized,
        phone: clientPhone || undefined,
        phoneNormalized: phoneNormalized || undefined,
        preferredLocale,
      },
      create: {
        email: clientEmail,
        emailNormalized,
        name: clientName,
        nameNormalized,
        phone: clientPhone || null,
        phoneNormalized,
        source: 'WEBSITE',
        preferredLocale,
      },
      select: { id: true },
    });

    let bookingRecord:
      | (Prisma.BookingGetPayload<{
          include: {
            pack: { include: { translations: true } };
            extras: { include: { extra: { include: { translations: true } } } };
          };
        }>)
      | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reference = generateBookingReference();
      try {
        bookingRecord = await tx.booking.create({
          data: {
            reference,
            customerId: customer.id,
            clientName,
            clientEmail,
            clientPhone,
            preferredLocale,
            eventType,
            eventDate,
            eventStartTime: body.eventStartTime,
            eventEndTime: body.eventEndTime,
            eventLocation,
            eventVenue,
            guestCount,
            packId,
            extraHours,
            subtotal,
            discount,
            vatRate,
            vatAmount,
            total,
            depositAmount: 0,
            remainingAmount: total,
            status: 'PENDING',
            notes,
            extras: {
              create: extras.map((extra) => ({
                extraId: extra.id,
                quantity: 1,
                price: extra.price,
              })),
            },
          },
          include: {
            pack: { include: { translations: true } },
            extras: { include: { extra: { include: { translations: true } } } },
          },
        });
        break;
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
      }
    }

    if (!bookingRecord) {
      throw new BookingError('REFERENCE_CONFLICT', 'Could not generate a unique booking reference');
    }

    await tx.availability.updateMany({
      where: { date: eventDate },
      data: {
        bookingId: bookingRecord.id,
        note: buildPublicBookingAvailabilityNote(clientName, bookingRecord.reference),
      },
    });

    await tx.adminLog.create({
      data: {
        action: 'CREATE',
        entity: 'booking',
        entityId: bookingRecord.id,
        details: {
          source: 'public_booking',
          reference: bookingRecord.reference,
          customerId: customer.id,
          clientName,
          clientEmail,
          preferredLocale,
          eventDate: bookingRecord.eventDate.toISOString(),
          eventType: bookingRecord.eventType,
          eventLocation,
          packId,
          extraIds: extras.map((extra) => extra.id),
          extraHours,
          subtotal,
          discount,
          vatRate,
          vatAmount,
          total,
          status: bookingRecord.status,
          availabilityStatus: 'BOOKED',
        },
      },
    });

    await recordCustomerBookingCreated({
      customerId: customer.id,
      bookingId: bookingRecord.id,
      reference: bookingRecord.reference,
      eventDate: bookingRecord.eventDate,
      eventType: bookingRecord.eventType,
      status: bookingRecord.status,
    }, tx);

    return bookingRecord;
  });

  try {
    await sendBookingConfirmation(booking);
    await sendBookingNotificationToAdmin(booking);
  } catch (emailError) {
    log.error('Failed to send booking confirmation emails', {
      error: emailError,
      bookingId: booking.id,
    });
  }

  log.info('Booking created successfully', {
    bookingId: booking.id,
    reference: booking.reference,
    eventDate: body.eventDate,
  });

  return {
    status: 201,
    body: {
      success: true,
      data: {
        bookingId: booking.id,
        reference: booking.reference,
        eventDate: booking.eventDate,
        total: booking.total,
      },
    },
  };
}

export function isDateUnavailableBookingError(error: unknown) {
  return error instanceof BookingError && error.code === 'DATE_UNAVAILABLE';
}
