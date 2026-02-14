import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

interface Params {
  params: { id: string };
}

function uidFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const uid = (metadata as { uid?: unknown }).uid;
  if (typeof uid === 'number' || typeof uid === 'string') return String(uid);
  return null;
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

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const activities = await prisma.leadActivity.findMany({
      where: { leadId: params.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        createdBy: true,
        metadata: true,
      },
    });

    const keepByKey = new Map<string, string>();
    const idsToDelete: string[] = [];

    for (const activity of activities) {
      const uid = uidFromMetadata(activity.metadata);
      const key = [
        uid ? `uid:${uid}` : '',
        `title:${(activity.title || '').trim()}`,
        `desc:${(activity.description || '').trim()}`,
        `by:${(activity.createdBy || '').trim()}`,
      ].join('|');

      if (keepByKey.has(key)) {
        idsToDelete.push(activity.id);
      } else {
        keepByKey.set(key, activity.id);
      }
    }

    if (idsToDelete.length > 0) {
      await prisma.leadActivity.deleteMany({
        where: {
          id: { in: idsToDelete },
          leadId: params.id,
        },
      });
    }

    return NextResponse.json({ ok: true, deleted: idsToDelete.length });
  } catch (error) {
    log.error('Error netejant activitats duplicades', error);
    return NextResponse.json({ error: 'Error netejant activitats duplicades' }, { status: 500 });
  }
}
