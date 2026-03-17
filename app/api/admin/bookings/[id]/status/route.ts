// app/api/admin/bookings/[id]/status/route.ts
// API específica per canviar estat de reserva
import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { changeBookingStatus } from '@/lib/services/bookingRouteService';

interface Params {
  params: { id: string };
}

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'] as const;
type BookingStatus = typeof VALID_STATUSES[number];

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const { status } = (await req.json()) as { status: BookingStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Estat invàlid' }, { status: 400 });
    }

    const result = await changeBookingStatus(params.id, status);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error canviant estat de reserva', error, { context: { bookingId: params.id } });
    return NextResponse.json({ error: 'Error canviant estat' }, { status: 500 });
  }
}
