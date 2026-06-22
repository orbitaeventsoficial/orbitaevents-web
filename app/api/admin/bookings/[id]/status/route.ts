// app/api/admin/bookings/[id]/status/route.ts
// API específica per canviar estat de reserva
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { changeBookingStatus } from '@/lib/services/bookingRouteService';
import { BOOKING_STATUS_VALUES } from '@/lib/constants';

interface Params {
  params: { id: string };
}

type BookingStatus = typeof BOOKING_STATUS_VALUES[number];

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const { status } = (await req.json()) as { status: BookingStatus };

    if (!status || !BOOKING_STATUS_VALUES.includes(status)) {
      return NextResponse.json({ error: 'Estat invàlid' }, { status: 400 });
    }

    const result = await changeBookingStatus(params.id, status);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error canviant estat de reserva', error, { context: { bookingId: params.id } });
    return NextResponse.json({ error: 'Error canviant estat' }, { status: 500 });
  }
}
