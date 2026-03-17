import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';

const bulkPaymentSchema = z.object({
  bookingIds: z.array(z.string()).min(1).max(100),
  field: z.enum(['depositPaid', 'remainingPaid']),
  value: z.boolean(),
});

export async function updateBulkBookingPayment(input: unknown, meta: { requestId?: string }) {
  const parsed = bulkPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400 as const,
      body: { ok: false, error: 'Error actualitzant pagaments' },
    };
  }

  const { bookingIds, field, value } = parsed.data;
  const now = new Date();
  const timestampField = field === 'depositPaid' ? 'depositPaidAt' : 'remainingPaidAt';
  const data: Record<string, unknown> = {
    [field]: value,
    [timestampField]: value ? now : null,
  };

  const result = await prisma.booking.updateMany({
    where: { id: { in: bookingIds } },
    data,
  });

  log.info(`Bulk payment update: ${field}=${value} per ${result.count} reserves`, {
    context: { requestId: meta.requestId, bookingIds },
  });

  return {
    status: 200 as const,
    body: { ok: true, updated: result.count },
  };
}
