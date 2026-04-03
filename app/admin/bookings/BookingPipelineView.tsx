'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BOOKING_PIPELINE_COLUMNS, BOOKING_STATUS_CONFIG, formatDateShort, formatCurrency } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';
import PipelineBoard, { type PipelineCardContext } from '@/app/admin/components/PipelineBoard';

type PipelineBooking = {
  id: string;
  reference: string;
  clientName: string;
  customerId: string | null;
  eventDate: string;
  eventType: string;
  total: number;
  depositPaid: boolean;
  status: string;
  leadId: string | null;
  marginPct: number | null;
};

const COLUMNS_DEF = [...BOOKING_PIPELINE_COLUMNS];

function getMarginColor(pct: number | null): string {
  if (pct === null) return 'admin-tone-text-neutral';
  if (pct > 40) return 'admin-tone-text-success';
  if (pct > 20) return 'admin-tone-text-warning';
  return 'admin-tone-text-danger';
}

export default function BookingPipelineView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<PipelineBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('limit', '500');
      params.set('pipeline', 'true');
      params.delete('page');
      params.delete('view');
      const res = await fetchWithCsrf(`/api/admin/bookings?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error carregant reserves');
      const data = await res.json();
      const rows = data?.data?.bookings || data?.bookings || data?.data || [];
      const mapped: PipelineBooking[] = rows.map((b: Record<string, unknown>) => ({
        id: b.id as string,
        reference: b.reference as string,
        clientName: b.clientName as string,
        customerId: (b.customerId as string) || null,
        eventDate: b.eventDate as string,
        eventType: b.eventType as string,
        total: Number(b.total) || 0,
        depositPaid: Boolean(b.depositPaid),
        status: b.status as string,
        leadId: (b.leadId as string) || (b.lead as Record<string, unknown>)?.id as string || null,
        marginPct: typeof b.marginPct === 'number' ? b.marginPct : null,
      }));
      setBookings(mapped);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error carregant reserves');
    } finally {
      setLoading(false);
    }
  }, [searchParams, toast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleBoardScroll = useCallback(() => {
    const board = boardRef.current;
    if (!board || typeof window === 'undefined' || window.innerWidth >= 768) return;
    const cols = Array.from(board.querySelectorAll('[data-pipeline-column]'));
    if (cols.length === 0) return;

    const boardRect = board.getBoundingClientRect();
    const boardCenter = boardRect.left + (boardRect.width / 2);
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    cols.forEach((column, index) => {
      const rect = column.getBoundingClientRect();
      const columnCenter = rect.left + (rect.width / 2);
      const distance = Math.abs(columnCenter - boardCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    setActiveColumnIndex(bestIndex);
  }, []);

  useEffect(() => { handleBoardScroll(); }, [handleBoardScroll, bookings]);

  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  // Column totals for metrics
  const columnMetrics = useMemo(() =>
    COLUMNS_DEF.map((col) => {
      const colBookings = bookings.filter((b) => b.status === col.status);
      return { ...col, count: colBookings.length, total: colBookings.reduce((sum, b) => sum + b.total, 0) };
    }),
  [bookings]);

  const moveBooking = useCallback(async (bookingId: string, newStatus: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === newStatus) return;
    const prevStatus = booking.status;

    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)));
    setUpdatingId(bookingId);

    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: prevStatus } : b)));
        toast.error('Error canviant l\'estat');
      } else {
        const targetLabel = COLUMNS_DEF.find((c) => c.status === newStatus)?.label || newStatus;
        toast.success(`Reserva moguda a ${targetLabel}`);
      }
    } catch (error) {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: prevStatus } : b)));
      toast.error(error instanceof Error ? error.message : 'Error de connexió');
    } finally {
      setUpdatingId(null);
    }
  }, [bookings, toast]);

  return (
    <div className="space-y-3" data-help-title="Pipeline de reserves" data-help-desc="Mostra totes les reserves actives per fase operativa. Pots canviar-ne l'estat des del mateix tauler.">
      {/* Metrics per column */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-help-title="Mètriques de reserves" data-help-desc="Cada targeta resumeix quantes reserves hi ha en cada estat i quin import econòmic acumulen.">
        {columnMetrics.map((col) => {
          const conf = BOOKING_STATUS_CONFIG[col.status];
          return (
            <div key={col.status} className="rounded-xl border p-2 text-center">
              <p className={`text-[10px] uppercase font-medium ${conf?.text || ''}`}>{col.label}</p>
              <p className="text-lg font-bold">{col.count}</p>
              <p className="text-[10px]">{formatCurrency(col.total)}</p>
            </div>
          );
        })}
      </div>

      {cancelledCount > 0 && (
        <p className="text-xs text-center" data-help-title="Cancel·lades ocultes" data-help-desc="Les reserves cancel·lades no es mostren al kanban principal per no embrutar l'operativa activa.">
          + {cancelledCount} cancel·lad{cancelledCount === 1 ? 'a' : 'es'} (ocultes del kanban)
        </p>
      )}

      {COLUMNS_DEF.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 md:hidden" data-help-title="Indicador de columna mòbil" data-help-desc="En mòbil serveix per saltar ràpidament entre columnes del kanban i saber on ets situat.">
          {COLUMNS_DEF.map((col, index) => (
            <button
              key={col.status}
              type="button"
              onClick={() => {
                const board = boardRef.current;
                const column = board?.querySelector(`[data-pipeline-column="${col.status}"]`);
                column?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              }}
              className={`h-2.5 rounded-full transition-all ${
                index === activeColumnIndex ? 'w-6 bg-[var(--admin-accent)]' : 'w-2.5 bg-black/15 dark:bg-white/20'
              }`}
              aria-label={`Anar a ${col.label}`}
              aria-pressed={index === activeColumnIndex}
            />
          ))}
        </div>
      )}

      {/* Kanban board */}
      <div data-help-title="Kanban de reserves" data-help-desc="Arrossega o canvia l'estat de cada reserva segons el punt operatiu: confirmada, preparada, completada o altres fases.">
        <PipelineBoard<PipelineBooking>
          columnsDef={COLUMNS_DEF}
          items={bookings}
          getId={(b) => b.id}
          getStatus={(b) => b.status}
          updatingId={updatingId}
          onMoveStatus={(id, status) => void moveBooking(id, status)}
          loading={loading}
          boardRef={boardRef}
          onBoardScroll={handleBoardScroll}
          gridClassName="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4"
          columnClassName="min-w-[86vw] shrink-0 snap-center md:min-w-0"
          renderColumnHeaderExtra={(_col, colIndex, total) => (
            <p className="mt-1 text-[11px] opacity-70 md:hidden">
              Columna {colIndex + 1} de {total}
            </p>
          )}
          renderEmptyColumn={() => (
            <div className="rounded-xl border border-dashed p-4 text-center text-xs">
              Cap reserva
            </div>
          )}
          virtualizeColumns
          maxVisiblePerColumn={500}
          estimatedItemHeight={150}
          renderCard={(booking, ctx) => (
            <BookingCard booking={booking} ctx={ctx} onMoveStatus={moveBooking} />
          )}
        />
      </div>
    </div>
  );
}

/* ── Card de reserva ────────────────────────────────────────────── */

function BookingCard({
  booking,
  ctx,
  onMoveStatus,
}: {
  booking: PipelineBooking;
  ctx: PipelineCardContext;
  onMoveStatus: (id: string, status: string) => Promise<void>;
}) {
  const { isUpdating, dragHandlers, statusIndex, columnCount } = ctx;
  const col = COLUMNS_DEF[statusIndex];
  const canForward = statusIndex < columnCount - 1;
  const canBack = statusIndex > 0;

  return (
    <div
      {...dragHandlers}
      aria-label={`Reserva ${booking.reference} — arrossega per moure`} data-help-title={booking.reference} data-help-desc={`Reserva de ${booking.clientName}. Pots obrir-la, revisar imports i moure-la a un altre estat.`}
      className={`admin-drag-item rounded-xl border p-3 transition-all hover:brightness-105 ${col.cardTone} ${
        isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Header: ref + arrows */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="text-sm font-semibold transition-colors line-clamp-1"
        >
          {booking.reference}
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          {canBack && (
            <button
              type="button"
              onClick={() => onMoveStatus(booking.id, COLUMNS_DEF[statusIndex - 1].status)}
              disabled={isUpdating}
              className="rounded px-1 py-0.5 text-[10px] hover:bg-black/20 transition-colors disabled:opacity-50"
              title={`Moure a ${COLUMNS_DEF[statusIndex - 1].label}`}
              aria-label={`Moure reserva a ${COLUMNS_DEF[statusIndex - 1].label}`}
            >
              ←
            </button>
          )}
          {canForward && (
            <button
              type="button"
              onClick={() => onMoveStatus(booking.id, COLUMNS_DEF[statusIndex + 1].status)}
              disabled={isUpdating}
              className="rounded px-1 py-0.5 text-[10px] hover:bg-black/20 transition-colors disabled:opacity-50"
              title={`Moure a ${COLUMNS_DEF[statusIndex + 1].label}`}
              aria-label={`Moure reserva a ${COLUMNS_DEF[statusIndex + 1].label}`}
            >
              →
            </button>
          )}
        </div>
      </div>

      {/* Client name */}
      <p className="text-xs mt-1 truncate">
        {booking.customerId ? (
          <Link href={`/admin/clientes/${booking.customerId}`} className="hover:underline">
            {booking.clientName}
          </Link>
        ) : booking.clientName}
      </p>

      {/* Indicators */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px]">{formatDateShort(booking.eventDate)}</span>
        <span className="font-semibold text-[10px]">{formatCurrency(booking.total)}</span>
        {booking.marginPct !== null && (
          <span className={`text-[10px] font-semibold ${getMarginColor(booking.marginPct)}`}>
            {booking.marginPct.toFixed(0)}%
          </span>
        )}
        {!booking.depositPaid && (
          <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium">
            Paga pendent
          </span>
        )}
      </div>

      {/* Mobile move buttons */}
      <div className="mt-2 flex gap-1 md:hidden">
        {COLUMNS_DEF.filter((c) => c.status !== COLUMNS_DEF[statusIndex].status).map((target) => (
          <button
            key={target.status}
            onClick={() => onMoveStatus(booking.id, target.status)}
            disabled={isUpdating}
            className="ap-btn ap-btn--secondary flex-1 px-2.5 py-2 text-xs min-h-[44px] disabled:opacity-50"
            aria-label={`Moure reserva a ${target.label}`}
          >
            {target.label}
          </button>
        ))}
      </div>
    </div>
  );
}





