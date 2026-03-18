import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const CATEGORY_MAP: Record<string, string> = {
  // Comunicacions
  COMM_SENT: 'comms',
  COMM_RESPONDED: 'comms',
  COMM_SEQUENCE_EXEC: 'comms',
  COMM_SEQUENCE_BATCH: 'comms',
  SEND_POST_EVENT_EMAIL: 'comms',
  PAYMENT_REMINDER_SENT: 'comms',
  // Automatitzacions
  AUTOMATION_DAILY_SUMMARY_SENT: 'automation',
  AUTOMATION_SLA_ENFORCED: 'automation',
  AUTOMATION_RUN_ALL: 'automation',
  AUTOMATION_FUEL_REFRESH: 'automation',
  PACK_PRICING_CHECK: 'automation',
  AUTOFIX_OK: 'automation',
  AUTOFIX_FAILED: 'automation',
  AUTOFIX_CRASH: 'automation',
  // Sistema
  CALENDAR_SYNC: 'system',
  CALENDAR_SYNC_ERROR: 'system',
  PORTAL_AUTO_CREATED: 'system',
  // CRUD
  CREATE: 'crud',
  UPDATE: 'crud',
  DELETE: 'crud',
};

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
    actionFilter = Object.entries(CATEGORY_MAP)
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
    const cat = CATEGORY_MAP[row.action] || 'other';
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
      category: CATEGORY_MAP[l.action] || 'other',
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    stats,
    page,
    pages: Math.ceil(total / limit),
  });
}
