import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { buildProfitabilityReport, normalizeProfitabilityConfig } from '@/lib/services/profitabilityService';
import { deriveFlowStatus } from '@/lib/services/communicationStatusService';
import EconomiaClient from './EconomiaClient';

export const dynamic = 'force-dynamic';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function EconomiaPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekAhead = addDays(now, 7);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. FINANCES DATA
  // ═══════════════════════════════════════════════════════════════════════════

  let bookings: Array<{
    id: string;
    reference: string;
    status: string;
    clientName: string;
    clientPhone: string;
    eventDate: Date;
    total: number;
    depositAmount: number;
    depositPaid: boolean;
    depositPaidAt: Date | null;
    remainingAmount: number;
    remainingPaid: boolean;
    remainingPaidAt: Date | null;
  }> = [];

  let commLogs: Array<{
    entityId: string | null;
    action: string;
    createdAt: Date;
    details: unknown;
  }> = [];

  try {
    bookings = await prisma.booking.findMany({
      where: { status: { not: 'CANCELLED' } },
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        reference: true,
        status: true,
        clientName: true,
        clientPhone: true,
        eventDate: true,
        total: true,
        depositAmount: true,
        depositPaid: true,
        depositPaidAt: true,
        remainingAmount: true,
        remainingPaid: true,
        remainingPaidAt: true,
      },
      take: 500,
    });

    if (bookings.length > 0) {
      commLogs = await prisma.adminLog.findMany({
        where: {
          entity: 'booking',
          entityId: { in: bookings.map((b) => b.id) },
          action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 2000,
      });
    }
  } catch (error) {
    log.error('Error carregant dades financeres', error);
    bookings = [];
    commLogs = [];
  }

  const logsByBooking = commLogs.reduce<Record<string, typeof commLogs>>((acc, item) => {
    if (!item.entityId) return acc;
    if (!acc[item.entityId]) acc[item.entityId] = [];
    acc[item.entityId].push(item);
    return acc;
  }, {});

  const rows = bookings.map((booking) => {
    const depositDueAt = addDays(new Date(booking.eventDate), -30);
    const remainingDueAt = addDays(new Date(booking.eventDate), -7);
    const overdueDeposit = !booking.depositPaid && depositDueAt < now;
    const overdueRemaining = !booking.remainingPaid && remainingDueAt < now;
    const dueSoonDeposit = !booking.depositPaid && depositDueAt >= now && depositDueAt <= weekAhead;
    const dueSoonRemaining = !booking.remainingPaid && remainingDueAt >= now && remainingDueAt <= weekAhead;
    const paymentFlow = deriveFlowStatus(logsByBooking[booking.id] || [], 'PAYMENT');

    return {
      ...booking,
      eventDate: booking.eventDate.toISOString(),
      depositPaidAt: booking.depositPaidAt?.toISOString() ?? null,
      remainingPaidAt: booking.remainingPaidAt?.toISOString() ?? null,
      depositDueAt: depositDueAt.toISOString(),
      remainingDueAt: remainingDueAt.toISOString(),
      overdueDeposit,
      overdueRemaining,
      dueSoonDeposit,
      dueSoonRemaining,
      paymentFlowState: paymentFlow.state,
    };
  });

  const outstandingTotal = rows.reduce((sum, row) => {
    return sum + (row.depositPaid ? 0 : row.depositAmount) + (row.remainingPaid ? 0 : row.remainingAmount);
  }, 0);
  const overdueTotal = rows.reduce((sum, row) => {
    return sum + (row.overdueDeposit ? row.depositAmount : 0) + (row.overdueRemaining ? row.remainingAmount : 0);
  }, 0);
  const dueSoonTotal = rows.reduce((sum, row) => {
    return sum + (row.dueSoonDeposit ? row.depositAmount : 0) + (row.dueSoonRemaining ? row.remainingAmount : 0);
  }, 0);
  const monthCollected = rows.reduce((sum, row) => {
    const depositCollected = row.depositPaidAt && new Date(row.depositPaidAt) >= monthStart ? row.depositAmount : 0;
    const remainingCollected = row.remainingPaidAt && new Date(row.remainingPaidAt) >= monthStart ? row.remainingAmount : 0;
    return sum + depositCollected + remainingCollected;
  }, 0);

  const atRiskRows = rows
    .filter((row) => row.overdueDeposit || row.overdueRemaining)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 30);

  const upcomingDueRows = rows
    .filter((row) => row.dueSoonDeposit || row.dueSoonRemaining)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 30);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PROFITABILITY DATA
  // ═══════════════════════════════════════════════════════════════════════════

  let report: Awaited<ReturnType<typeof buildProfitabilityReport>> | null = null;
  let reportError = false;

  try {
    report = await buildProfitabilityReport();
  } catch (error) {
    reportError = true;
    log.error('Error generant informe de rendibilitat', error);
  }

  // History logs
  const historyLogs = await prisma.adminLog.findMany({
    where: {
      entity: 'setting',
      entityId: 'finance.profitabilityConfig',
      action: 'UPDATE',
    },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });

  const historyEntries = historyLogs.map((logItem) => {
    const details = (logItem.details && typeof logItem.details === 'object'
      ? (logItem.details as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const before = normalizeProfitabilityConfig(details.before);
    const after = normalizeProfitabilityConfig(details.after);
    return {
      id: logItem.id,
      createdAt: logItem.createdAt.toISOString(),
      role: typeof details.role === 'string' ? details.role : 'OWNER',
      before,
      after,
    };
  });

  // Serialize profitability rows for client
  const serializeRow = (row: { id: string; reference: string; clientName: string; eventDate: Date; source: string; netMargin: number; marginPct: number; travelCost: number }) => ({
    id: row.id,
    reference: row.reference,
    clientName: row.clientName,
    eventDate: row.eventDate.toISOString(),
    source: row.source,
    netMargin: row.netMargin,
    marginPct: row.marginPct,
    travelCost: row.travelCost,
  });

  const defaultConfig = normalizeProfitabilityConfig(null);

  return (
    <EconomiaClient
      outstandingTotal={outstandingTotal}
      overdueTotal={overdueTotal}
      dueSoonTotal={dueSoonTotal}
      monthCollected={monthCollected}
      atRiskRows={atRiskRows}
      upcomingDueRows={upcomingDueRows}
      hasReport={!!report}
      reportError={reportError}
      realized={report?.realized ?? { revenue: 0, netMargin: 0, avgMarginPct: 0, bookings: 0 }}
      forecast={report?.forecast ?? { revenue: 0, netMargin: 0, avgMarginPct: 0, bookings: 0 }}
      topProfitability={report?.topProfitability.map(serializeRow) ?? []}
      riskProfitability={report?.riskProfitability.map(serializeRow) ?? []}
      bySource={report?.bySource ?? []}
      config={report?.config ?? defaultConfig}
      historyEntries={historyEntries}
    />
  );
}
