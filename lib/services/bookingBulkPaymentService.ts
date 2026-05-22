import { prisma } from '@/lib/prisma';

type PaymentField = 'depositPaid' | 'remainingPaid';

export async function updateBulkPaymentField(
  bookingIds: string[],
  field: PaymentField,
  value: boolean,
): Promise<{ count: number }> {
  const timestampField = field === 'depositPaid' ? 'depositPaidAt' : 'remainingPaidAt';
  const now = new Date();
  return prisma.booking.updateMany({
    where: { id: { in: bookingIds } },
    data: { [field]: value, [timestampField]: value ? now : null },
  });
}
