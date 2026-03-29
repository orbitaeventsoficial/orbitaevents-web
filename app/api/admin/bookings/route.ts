// app/api/admin/bookings/route.ts
// API per gestionar reserves
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';
import { safeParseInt } from '@/lib/utils';
import { z } from 'zod';
import { createBookingFromInput } from '@/lib/services/bookingCreationService';
import { listAdminBookings } from '@/lib/services/bookingListService';

export const dynamic = 'force-dynamic';

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
