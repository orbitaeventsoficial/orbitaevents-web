import { prisma } from '@/lib/prisma';

function toMiddayDate(raw: string) {
  const date = new Date(raw);
  date.setHours(12, 0, 0, 0);
  return date;
}

export async function listBlockedAvailability(from?: string | null, to?: string | null) {
  const where: Record<string, unknown> = { status: 'BLOCKED' };
  if (from && to) {
    where.date = { gte: new Date(from), lte: new Date(to) };
  }

  const blocked = await prisma.availability.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  return { ok: true, blocked };
}

export async function blockAvailabilityDay(date?: string, note?: string | null) {
  if (!date) {
    return { status: 400, body: { error: 'Cal especificar una data' } };
  }

  const dateObj = toMiddayDate(date);
  const existing = await prisma.availability.findUnique({ where: { date: dateObj } });

  if (existing) {
    const updated = await prisma.availability.update({
      where: { id: existing.id },
      data: { status: 'BLOCKED', note: note || null },
    });
    return { status: 200, body: { ok: true, availability: updated } };
  }

  const created = await prisma.availability.create({
    data: {
      date: dateObj,
      status: 'BLOCKED',
      note: note || null,
    },
  });

  return { status: 200, body: { ok: true, availability: created } };
}

export async function unblockAvailabilityDay(id?: string | null, date?: string | null) {
  if (id) {
    await prisma.availability.delete({ where: { id } });
    return { status: 200, body: { ok: true } };
  }

  if (date) {
    const dateObj = toMiddayDate(date);
    await prisma.availability.deleteMany({ where: { date: dateObj } });
    return { status: 200, body: { ok: true } };
  }

  return { status: 400, body: { error: 'Cal id o date' } };
}
