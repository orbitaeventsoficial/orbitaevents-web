import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

const createActivitySchema = z.object({
  action: z.string().min(1).max(80).optional(),
  note: z.string().min(1).max(4000),
});

export async function GET(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const activities = await prisma.customerActivity.findMany({
      where: { customerId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 120,
    });
    return NextResponse.json({ ok: true, activities });
  } catch (error) {
    log.error('Error obtenint activitats de client', error, {
      context: { customerId: params.id, endpoint: 'admin/customers/[id]/activities:GET' },
    });
    return NextResponse.json({ ok: false, error: 'Error obtenint activitats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  try {
    const parsed = createActivitySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Dades invàlides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const action = parsed.data.action?.trim() || 'NOTE_ADDED';
    const note = parsed.data.note.trim();

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ ok: false, error: 'Client no trobat' }, { status: 404 });
    }

    const activity = await prisma.customerActivity.create({
      data: {
        customerId: params.id,
        action,
        details: { note },
      },
    });

    return NextResponse.json({ ok: true, activity }, { status: 201 });
  } catch (error) {
    log.error('Error creant activitat de client', error, {
      context: { customerId: params.id, endpoint: 'admin/customers/[id]/activities:POST' },
    });
    return NextResponse.json({ ok: false, error: 'Error creant activitat' }, { status: 500 });
  }
}

