import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';

interface Params {
  params: { id: string; activityId: string };
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const existing = await prisma.leadActivity.findFirst({
      where: {
        id: params.activityId,
        leadId: params.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Activitat no trobada' }, { status: 404 });
    }

    await prisma.leadActivity.delete({
      where: { id: params.activityId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error eliminant activitat de lead', error, {
      context: { leadId: params.id, activityId: params.activityId },
    });
    return NextResponse.json({ error: 'Error eliminant activitat' }, { status: 500 });
  }
}
