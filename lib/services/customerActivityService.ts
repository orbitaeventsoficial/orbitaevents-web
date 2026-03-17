import { prisma } from '@/lib/prisma';

export async function listCustomerActivities(customerId: string) {
  const activities = await prisma.customerActivity.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });

  return { ok: true, activities };
}

export async function createCustomerActivityNote(customerId: string, input: { action?: string; note: string }) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true },
  });

  if (!customer) {
    return { status: 404, body: { ok: false, error: 'Client no trobat' } };
  }

  const activity = await prisma.customerActivity.create({
    data: {
      customerId,
      action: input.action?.trim() || 'NOTE_ADDED',
      details: { note: input.note.trim() },
    },
  });

  return { status: 201, body: { ok: true, activity } };
}
