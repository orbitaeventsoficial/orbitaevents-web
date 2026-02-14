import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import PaymentToggleButton from './PaymentToggleButton';
import PaymentReminderActions from './PaymentReminderActions';
import { deriveFlowStatus } from '@/lib/services/communicationStatusService';

export const dynamic = 'force-dynamic';

function currency(value: number) {
  return `${value.toLocaleString('ca-ES')}€`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default async function FinanzasPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekAhead = addDays(now, 7);

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
          entityId: { in: bookings.map((booking) => booking.id) },
          action: { in: ['COMM_SENT', 'COMM_RESPONDED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 2000,
      });
    }
  } catch {
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
    return {
      ...booking,
      depositDueAt,
      remainingDueAt,
      overdueDeposit,
      overdueRemaining,
      dueSoonDeposit,
      dueSoonRemaining,
    };
  });

  const outstandingTotal = rows.reduce((sum, row) => {
    return sum + (row.depositPaid ? 0 : row.depositAmount) + (row.remainingPaid ? 0 : row.remainingAmount);
  }, 0);
  const overdueTotal = rows.reduce((sum, row) => {
    return sum
      + (row.overdueDeposit ? row.depositAmount : 0)
      + (row.overdueRemaining ? row.remainingAmount : 0);
  }, 0);
  const dueSoonTotal = rows.reduce((sum, row) => {
    return sum
      + (row.dueSoonDeposit ? row.depositAmount : 0)
      + (row.dueSoonRemaining ? row.remainingAmount : 0);
  }, 0);
  const monthCollected = rows.reduce((sum, row) => {
    const depositCollected = row.depositPaidAt && row.depositPaidAt >= monthStart ? row.depositAmount : 0;
    const remainingCollected = row.remainingPaidAt && row.remainingPaidAt >= monthStart ? row.remainingAmount : 0;
    return sum + depositCollected + remainingCollected;
  }, 0);

  const atRiskRows = rows
    .filter((row) => row.overdueDeposit || row.overdueRemaining)
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .slice(0, 30);

  const upcomingDueRows = rows
    .filter((row) => row.dueSoonDeposit || row.dueSoonRemaining)
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
    .slice(0, 30);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">Finanzas y cobros</h1>
        <p className="mt-1 text-sm text-slate-500">
          Control de señales, saldos pendientes y caja prevista.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pendiente total</p>
          <p className="text-2xl font-semibold text-slate-800">{currency(outstandingTotal)}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-xs text-rose-700">Vencido</p>
          <p className="text-2xl font-semibold text-rose-700">{currency(overdueTotal)}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs text-amber-700">Vence en 7 días</p>
          <p className="text-2xl font-semibold text-amber-700">{currency(dueSoonTotal)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs text-emerald-700">Cobrado este mes</p>
          <p className="text-2xl font-semibold text-emerald-700">{currency(monthCollected)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Cobros vencidos</h2>
          <Link href="/admin/bookings" className="text-sm text-slate-500 hover:text-slate-700">
            Ver reservas
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {atRiskRows.length === 0 ? (
            <p className="text-sm text-slate-500">No hay cobros vencidos.</p>
          ) : (
            atRiskRows.map((row) => (
              <div key={row.id} className="rounded-lg border border-stone-200 p-3">
                {(() => {
                  const paymentFlow = deriveFlowStatus(logsByBooking[row.id] || [], 'PAYMENT');
                  return (
                    <p className="mb-2 text-xs text-slate-500">
                      Estado contacto cobro: <strong>{paymentFlow.state}</strong>
                    </p>
                  );
                })()}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {row.reference} · {row.clientName}
                  </p>
                  <Link href={`/admin/bookings/${row.id}`} className="text-xs text-blue-600 hover:underline">
                    Abrir evento
                  </Link>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Evento: {row.eventDate.toLocaleDateString('ca-ES')} · Estado: {row.status}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md bg-slate-50 p-2 text-xs">
                    <p className="text-slate-500">Señal ({currency(row.depositAmount)}) · vence {row.depositDueAt.toLocaleDateString('ca-ES')}</p>
                    <PaymentToggleButton bookingId={row.id} field="depositPaid" currentValue={row.depositPaid} />
                  </div>
                  <div className="rounded-md bg-slate-50 p-2 text-xs">
                    <p className="text-slate-500">Saldo ({currency(row.remainingAmount)}) · vence {row.remainingDueAt.toLocaleDateString('ca-ES')}</p>
                    <PaymentToggleButton bookingId={row.id} field="remainingPaid" currentValue={row.remainingPaid} />
                  </div>
                </div>
                <PaymentReminderActions
                  bookingId={row.id}
                  phone={row.clientPhone}
                  message={`Hola ${row.clientName}, te recordamos el cobro pendiente de tu evento ${row.reference}. Gracias.`}
                />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Próximos cobros (7 días)</h2>
        <div className="mt-3 space-y-2">
          {upcomingDueRows.length === 0 ? (
            <p className="text-sm text-slate-500">No hay cobros próximos en la próxima semana.</p>
          ) : (
            upcomingDueRows.map((row) => (
              <div key={row.id} className="rounded-lg border border-stone-200 p-3 text-xs text-slate-600">
                {row.reference} · {row.clientName} · evento {row.eventDate.toLocaleDateString('ca-ES')}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
