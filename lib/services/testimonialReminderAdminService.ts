import { prisma } from '@/lib/prisma';

export async function getPendingTestimonialsReminderCount() {
  const pendingCount = await prisma.customerTestimonial.count({
    where: { isApproved: false },
  });

  return { ok: true, pendingCount };
}
