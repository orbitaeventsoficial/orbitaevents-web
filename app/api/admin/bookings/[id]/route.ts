// app/api/admin/bookings/[id]/route.ts
// API per gestionar reserva individual
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';
import { deleteBookingIfAllowed, getBookingDetail, updateBookingDetail } from '@/lib/services/bookingRouteService';
import type { ManagedBookingStatus } from '@/lib/services/bookingStatusTransitionService';
import { collaboratorLineCostErrorMessage, findCollaboratorLinesWithoutCost } from '@/lib/booking-service-line-validation';

interface Params {
  params: { id: string };
}

type DeleteBookingPayload = {
  id: string;
  reference: string;
  status: ManagedBookingStatus;
  eventDate: Date | string;
  customerId?: string | null;
};

const MANAGED_BOOKING_STATUSES: ManagedBookingStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'];
const EVENT_TYPES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION', 'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'] as const;
const requiredTrimmedString = z.string().trim().min(1);
const optionalTrimmedString = z.string().trim().optional();
const nullableTrimmedString = z.string().trim().nullable().optional();
const nullableTrimmedNonEmptyString = z.string().trim().min(1).nullable().optional();

function isDeleteBookingPayload(value: unknown): value is DeleteBookingPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.reference === 'string' &&
    typeof candidate.status === 'string' &&
    (candidate.eventDate instanceof Date || typeof candidate.eventDate === 'string') &&
    MANAGED_BOOKING_STATUSES.includes(candidate.status as ManagedBookingStatus)
  );
}

const serviceLineSchema = z.object({
  collaboratorId: nullableTrimmedNonEmptyString,
  sortOrder: z.number().int().optional(),
  partyType: nullableTrimmedString,
  kind: z.enum(['DJ', 'SOUND_TECH', 'PROVIDER_SERVICE', 'EQUIPMENT', 'OTHER']).optional(),
  label: requiredTrimmedString,
  revenueAmount: z.number().min(0).nullable().optional(),
  costAmount: z.number().nullable().optional(),
  quantity: z.number().int().positive().nullable().optional(),
  hours: z.number().positive().nullable().optional(),
  notes: nullableTrimmedString,
});

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED']).optional(),
  clientName: requiredTrimmedString.optional(),
  clientEmail: z.string().trim().email().optional(),
  clientPhone: requiredTrimmedString.optional(),
  eventType: z.enum(EVENT_TYPES).optional(),
  eventDate: requiredTrimmedString.optional(),
  eventLocation: requiredTrimmedString.optional(),
  sourceCollaboratorId: nullableTrimmedNonEmptyString,
  billedCollaboratorId: nullableTrimmedNonEmptyString,
  guestCount: z.number().optional(),
  eventVenue: optionalTrimmedString,
  totalPrice: z.number().positive().optional(),
  depositAmount: z.number().min(0).optional(),
  depositPaid: z.boolean().optional(),
  depositPaidAt: nullableTrimmedString,
  remainingAmount: z.number().min(0).optional(),
  remainingPaid: z.boolean().optional(),
  remainingPaidAt: nullableTrimmedString,
  notes: optionalTrimmedString,
  internalNotes: optionalTrimmedString,
  startTime: optionalTrimmedString,
  endTime: optionalTrimmedString,
  distanceKm: z.number().min(0).optional(),
  fuelCostPerKm: z.number().min(0).optional(),
  tollsEur: z.number().min(0).optional(),
  travelCost: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  paymentMethod: z.enum(['INVOICE', 'CASH', 'TRANSFER']).optional(),
  invoiceRequired: z.boolean().optional(),
  cashAmount: z.number().min(0).nullable().optional(),
  eventPhone: nullableTrimmedString,
  eventAddress: nullableTrimmedString,
  eventStartTime: nullableTrimmedString,
  eventEndTime: nullableTrimmedString,
  serviceLines: z.array(serviceLineSchema).optional(),
}).strict().superRefine((data, ctx) => {
  const issue = findCollaboratorLinesWithoutCost(data.serviceLines ?? [])[0];
  if (!issue) return;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['serviceLines', issue.index, 'costAmount'],
    message: collaboratorLineCostErrorMessage(issue),
  });
});

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);

  try {
    const result = await getBookingDetail(params.id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error obtenint reserva', error, {
      context: { requestId, endpoint: 'admin/bookings/[id]:GET', bookingId: params.id },
    });
    return NextResponse.json({ error: 'Error obtenint reserva' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);
  let customerIdForLog: string | null = null;

  try {
    const rawBody = await req.json();
    const parseResult = updateBookingSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Dades invàlides', details: parseResult.error.flatten() }, { status: 400 });
    }

    const result = await updateBookingDetail(params.id, { ...parseResult.data });
    customerIdForLog = result.customerId ?? null;

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error actualitzant reserva', error, {
      context: {
        requestId,
        endpoint: 'admin/bookings/[id]:PATCH',
        bookingId: params.id,
        customerId: customerIdForLog,
      },
    });
    return NextResponse.json({ error: 'Error actualitzant reserva' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);
  let customerIdForLog: string | null = null;

  try {
    const existing = await getBookingDetail(params.id);
    if (existing.status === 404) {
      return NextResponse.json(existing.body, { status: existing.status });
    }

    const booking = (existing.body as { booking?: unknown }).booking;
    if (!isDeleteBookingPayload(booking)) {
      return NextResponse.json({ error: 'Reserva no trobada' }, { status: 404 });
    }
    customerIdForLog = booking.customerId || null;
    const result = await deleteBookingIfAllowed(booking);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error eliminant reserva', error, {
      context: {
        requestId,
        endpoint: 'admin/bookings/[id]:DELETE',
        bookingId: params.id,
        customerId: customerIdForLog,
      },
    });
    return NextResponse.json({ error: 'Error eliminant reserva' }, { status: 500 });
  }
}
