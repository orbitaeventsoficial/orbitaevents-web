// app/api/admin/bookings/route.ts
// API per gestionar reserves
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';
import { safeParseInt } from '@/lib/utils';
import { z } from 'zod';
import { createBookingFromInput } from '@/lib/services/bookingCreationService';
import { listAdminBookings } from '@/lib/services/bookingListService';

export const dynamic = 'force-dynamic';

const requiredTrimmedString = z.string().trim().min(1);
const optionalTrimmedString = z.string().trim().optional();

const bookingSchema = z.object({
  leadId: optionalTrimmedString,
  customerId: optionalTrimmedString,
  sourceCollaboratorId: z.string().trim().nullable().optional(),
  billedCollaboratorId: z.string().trim().nullable().optional(),
  clientName: requiredTrimmedString,
  clientEmail: z.string().trim().email(),
  clientPhone: requiredTrimmedString,
  eventType: z.enum([
    'WEDDING', 'BIRTHDAY', 'CORPORATE', 'COMMUNION',
    'BAPTISM', 'GRADUATION', 'ANNIVERSARY', 'PRIVATE_PARTY', 'OTHER'
  ]),
  eventDate: requiredTrimmedString,
  eventStartTime: optionalTrimmedString,
  eventEndTime: optionalTrimmedString,
  eventLocation: requiredTrimmedString,
  eventVenue: optionalTrimmedString,
  guestCount: z.number().min(1),
  packId: requiredTrimmedString,
  customPackPrice: z.number().positive().optional(),
  manualTotalPrice: z.number().positive().optional(),
  invoiceRequired: z.boolean().optional(),
  extraHours: z.number().min(0).optional(),
  extras: z.array(z.object({
    extraId: requiredTrimmedString,
    quantity: z.number().int().positive().optional(),
    price: z.number().min(0),
  })).optional(),
  discount: z.number().min(0).optional(),
  discountCode: optionalTrimmedString,
  notes: optionalTrimmedString,
  distanceKm: z.number().min(0).optional(),
  tollsEur: z.number().min(0).optional(),
  fuelCostPerKm: z.number().min(0).optional(),
  travelCost: z.number().min(0).optional(),
  serviceLines: z.array(z.object({
    collaboratorId: z.string().trim().nullable().optional(),
    sortOrder: z.number().int().optional(),
    partyType: z.string().trim().nullable().optional(),
    kind: z.enum(['DJ', 'SOUND_TECH', 'PROVIDER_SERVICE', 'EQUIPMENT', 'OTHER']).optional(),
    label: requiredTrimmedString,
    revenueAmount: z.number().min(0).nullable().optional(),
    costAmount: z.number().nullable().optional(),
    quantity: z.number().int().positive().nullable().optional(),
    hours: z.number().positive().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })).optional(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);

  try {
    const { searchParams } = new URL(req.url);
    const localeParam = String(searchParams.get('locale') || 'ca').toLowerCase();
    const locale = localeParam.startsWith('es') ? 'es' : localeParam.startsWith('en') ? 'en' : 'ca';
    const isPipeline = searchParams.get('pipeline') === 'true';

    return NextResponse.json(await listAdminBookings({
      locale,
      status: searchParams.get('status'),
      eventType: searchParams.get('eventType'),
      fromDate: searchParams.get('fromDate'),
      toDate: searchParams.get('toDate'),
      search: searchParams.get('search'),
      payment: searchParams.get('payment'),
      customerId: searchParams.get('customerId'),
      page: safeParseInt(searchParams.get('page'), 1, 1),
      limit: safeParseInt(searchParams.get('limit'), 25, 1, isPipeline ? 1000 : 200),
    }));
  } catch (error) {
    log.error('Error obtenint reserves:', error, {
      context: { requestId, endpoint: 'admin/bookings:GET' },
    });
    return NextResponse.json({ error: 'Error obtenint reserves' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createBookingFromInput(parsed.data);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error creant reserva:', error, {
      context: {
        requestId,
        endpoint: 'admin/bookings:POST',
      },
    });
    return NextResponse.json({ error: 'Error creant reserva' }, { status: 500 });
  }
}
