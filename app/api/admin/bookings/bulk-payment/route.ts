import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkPaymentSchema = z.object({
  bookingIds: z.array(z.string()).min(1).max(100),
  field: z.enum(['depositPaid', 'remainingPaid']),
  value: z.boolean(),
});

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const requestId = getRequestId(req);

  try {
    const body = await req.json();
    const parsed = bulkPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Error actualitzant pagaments' }, { status: 400 });
    }

    const { bookingIds, field, value } = parsed.data;
    const now = new Date();
    const timestampField = field === 'depositPaid' ? 'depositPaidAt' : 'remainingPaidAt';

    const result = await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { [field]: value, [timestampField]: value ? now : null },
    });

    log.info(`Bulk payment update: ${field}=${value} per ${result.count} reserves`, {
      context: { requestId, bookingIds },
    });

    return NextResponse.json({ ok: true, updated: result.count });
  } catch (error) {
    log.error('Error bulk payment', error, {
      context: { requestId, endpoint: 'admin/bookings/bulk-payment:POST' },
    });
    return NextResponse.json({ ok: false, error: 'Error actualitzant pagaments' }, { status: 400 });
  }
}
