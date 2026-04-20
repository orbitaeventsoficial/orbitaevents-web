import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const offset = Number(searchParams.get('offset') || 0);
    const action = searchParams.get('action');

    const where: Record<string, unknown> = {};
    if (action && action !== 'all') {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.privacyAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.privacyAuditLog.count({ where }),
    ]);

    return NextResponse.json({ ok: true, body: { logs, total } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


