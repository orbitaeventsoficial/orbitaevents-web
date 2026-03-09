import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

// GET - Obtenir dies bloquejats per un rang de dates
export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');

  const where: Record<string, unknown> = { status: 'BLOCKED' };
  if (from && to) {
    where.date = { gte: new Date(from), lte: new Date(to) };
  }

  const blocked = await prisma.availability.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  return NextResponse.json({ ok: true, blocked });
}

// POST - Bloquejar un dia
export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const { date, note } = body;

  if (!date) {
    return NextResponse.json({ error: 'Cal especificar una data' }, { status: 400 });
  }

  const dateObj = new Date(date);
  dateObj.setHours(12, 0, 0, 0);

  const existing = await prisma.availability.findUnique({
    where: { date: dateObj },
  });

  if (existing) {
    const updated = await prisma.availability.update({
      where: { id: existing.id },
      data: { status: 'BLOCKED', note: note || null },
    });
    return NextResponse.json({ ok: true, availability: updated });
  }

  const created = await prisma.availability.create({
    data: {
      date: dateObj,
      status: 'BLOCKED',
      note: note || null,
    },
  });

  return NextResponse.json({ ok: true, availability: created });
}

// DELETE - Desbloquejar un dia
export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  const id = req.nextUrl.searchParams.get('id');
  const date = req.nextUrl.searchParams.get('date');

  if (id) {
    await prisma.availability.delete({ where: { id } });
  } else if (date) {
    const dateObj = new Date(date);
    dateObj.setHours(12, 0, 0, 0);
    await prisma.availability.deleteMany({ where: { date: dateObj } });
  } else {
    return NextResponse.json({ error: 'Cal id o date' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
