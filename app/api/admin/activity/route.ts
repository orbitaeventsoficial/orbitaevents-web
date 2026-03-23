import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_ACTIVITY_CATEGORY_MAP } from '@/lib/constants/admin';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category'); // comms | automation | system | crud
  const days = Math.min(Number(searchParams.get('days')) || 7, 90);
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Filter by category → resolve to action names
  let actionFilter: string[] | undefined;
  if (category && category !== 'all') {
    actionFilter = Object.entries(ADMIN_ACTIVITY_CATEGORY_MAP)
      .filter(([, cat]) => cat === category)
      .map(([action]) => action);
    if (actionFilter.length === 0) {
      return NextResponse.json({ logs: [], total: 0, stats: {} });
    }
  }

  const where = {
    createdAt: { gte: since },
    ...(actionFilter ? { action: { in: actionFilter } } : {}),
  };

  const [logs, total, statsByAction] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.adminLog.count({ where }),
    prisma.adminLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { action: 'desc' } },
    }),
  ]);

  // Build stats grouped by category
  const stats: Record<string, { total: number; actions: Record<string, number> }> = {};
  for (const row of statsByAction) {
    const cat = ADMIN_ACTIVITY_CATEGORY_MAP[row.action] || 'other';
    if (!stats[cat]) stats[cat] = { total: 0, actions: {} };
    stats[cat].total += row._count;
    stats[cat].actions[row.action] = row._count;
  }

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details,
      category: ADMIN_ACTIVITY_CATEGORY_MAP[l.action] || 'other',
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    stats,
    page,
    pages: Math.ceil(total / limit),
  });
}
