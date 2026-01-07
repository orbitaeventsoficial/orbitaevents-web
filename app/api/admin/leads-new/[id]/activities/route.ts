import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

interface Params {
  params: { id: string };
}

const activitySchema = z.object({
  type: z.enum(['NOTE', 'STATUS_CHANGE', 'EMAIL', 'CALL', 'WHATSAPP', 'DOCUMENT', 'TASK', 'SYSTEM']).optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  createdBy: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const authError = requireAuth(_req);
  if (authError) return authError;
  try {
    const activities = await prisma.leadActivity.findMany({
      where: { leadId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, activities });
  } catch (error) {
    log.error('Error obtenint activitats', error);
    return NextResponse.json({ error: 'Error obtenint activitats' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const parsed = activitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dades invàlides', details: parsed.error.flatten() }, { status: 400 });
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId: params.id,
        type: parsed.data.type ?? 'SYSTEM',
        title: parsed.data.title,
        description: parsed.data.description,
        createdBy: parsed.data.createdBy,
      },
    });

    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    log.error('Error creant activitat', error);
    return NextResponse.json({ error: 'Error creant activitat' }, { status: 500 });
  }
}