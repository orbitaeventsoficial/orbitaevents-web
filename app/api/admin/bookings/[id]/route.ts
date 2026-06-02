// app/api/admin/bookings/[id]/route.ts
// API per gestionar reserva individual
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';
import { deleteBookingIfAllowed, getBookingDetail, updateBookingDetail } from '@/lib/services/bookingRouteService';
import type { ManagedBookingStatus } from '@/lib/services/bookingStatusTransitionService';
import { dispatchAutoTrigger } from '@/lib/services/automationTriggers';

interface Params {
  params: { id: string };
}

type DeleteBookingPayload = {
  id: string;
  reference: string;
  status: ManagedBookingStatus;
  customerId?: string | null;
};

const MANAGED_BOOKING_STATUSES: ManagedBookingStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'];

function isDeleteBookingPayload(value: unknown): value is DeleteBookingPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.reference === 'string' &&
    typeof candidate.status === 'string' &&
    MANAGED_BOOKING_STATUSES.includes(candidate.status as ManagedBookingStatus)
  );
}

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED']).optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  guestCount: z.number().optional(),
  eventVenue: z.string().optional(),
  totalPrice: z.number().optional(),
  depositAmount: z.number().optional(),
  depositPaid: z.boolean().optional(),
  depositPaidAt: z.string().nullable().optional(),
  remainingAmount: z.number().optional(),
  remainingPaid: z.boolean().optional(),
  remainingPaidAt: z.string().nullable().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  distanceKm: z.number().min(0).optional(),
  fuelCostPerKm: z.number().min(0).optional(),
  travelCost: z.number().min(0).optional(),
  paymentMethod: z.enum(['INVOICE', 'CASH', 'TRANSFER']).optional(),
  invoiceRequired: z.boolean().optional(),
  cashAmount: z.number().nullable().optional(),
  eventPhone: z.string().nullable().optional(),
  eventAddress: z.string().nullable().optional(),
  eventStartTime: z.string().nullable().optional(),
  eventEndTime: z.string().nullable().optional(),
}).strict();

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

    // Auto-trigger: booking confirmed → pre-event checklist
    if (parseResult.data.status === 'CONFIRMED') {
      dispatchAutoTrigger({ type: 'booking.confirmed', bookingId: params.id }).catch(() => {});
    }

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



