import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { updateBulkBookingPayment } from '@/lib/services/bookingBulkPaymentService';

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const result = await updateBulkBookingPayment(body, { requestId });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error bulk payment', error, {
      context: { requestId, endpoint: 'admin/bookings/bulk-payment:POST' },
    });
    return NextResponse.json(
      { ok: false, error: 'Error actualitzant pagaments' },
      { status: 400 }
    );
  }
}
