'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BOOKING_PIPELINE_COLUMNS, BOOKING_STATUS_CONFIG, formatDateShort, formatCurrency } from '@/lib/constants';
import { useToast } from '@/app/admin/components/ToastProvider';
import { fetchWithCsrf } from '@/lib/csrf';

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

type PipelineColumn = {
  status: string;
  label: string;
  toneClass: string;
  cardTone: string;
  bookings: PipelineBooking[];
};

const COLUMNS_DEF: Omit<PipelineColumn, 'bookings'>[] = [...BOOKING_PIPELINE_COLUMNS];

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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
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
    const columns = Array.from(board.querySelectorAll('[data-pipeline-column]'));
    if (columns.length === 0) return;

    const boardRect = board.getBoundingClientRect();
    const boardCenter = boardRect.left + (boardRect.width / 2);
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    columns.forEach((column, index) => {
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

  const columns: PipelineColumn[] = COLUMNS_DEF.map((col) => ({
    ...col,
    bookings: bookings.filter((b) => b.status === col.status),
  }));

  useEffect(() => {
    handleBoardScroll();
  }, [handleBoardScroll, bookings]);

  // Also count cancelled separately
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  const moveBooking = async (bookingId: string, newStatus: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status === newStatus) return;
    const prevStatus = booking.status;

    // Optimistic update
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
  };

  const handleDrop = (targetStatus: string) => {
    if (!draggingId) return;
    setDragOverStatus(null);
    void moveBooking(draggingId, targetStatus);
    setDraggingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Metrics per column */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {columns.map((col) => {
          const colTotal = col.bookings.reduce((sum, b) => sum + b.total, 0);
          const conf = BOOKING_STATUS_CONFIG[col.status];
          return (
            <div key={col.status} className="rounded-xl border p-2 text-center">
              <p className={`text-[10px] uppercase font-medium ${conf?.text || ''}`}>{col.label}</p>
              <p className="text-lg font-bold">{col.bookings.length}</p>
              <p className="text-[10px]">{formatCurrency(colTotal)}</p>
            </div>
          );
        })}
      </div>

      {cancelledCount > 0 && (
        <p className="text-xs text-center">
          + {cancelledCount} cancel·lad{cancelledCount === 1 ? 'a' : 'es'} (ocultes del kanban)
        </p>
      )}

      {columns.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 md:hidden">
          {columns.map((col, index) => (
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
      <div
        ref={boardRef}
        onScroll={handleBoardScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4"
      >
        {columns.map((col, index) => (
          <div
            key={col.status}
            data-pipeline-column={col.status}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverStatus(col.status); }}
            onDragLeave={() => { if (dragOverStatus === col.status) setDragOverStatus(null); }}
            onDrop={(e) => { e.preventDefault(); handleDrop(col.status); }}
            className={`rounded-2xl border flex min-h-[320px] min-w-[86vw] shrink-0 snap-center flex-col transition-all md:min-w-0 ${col.toneClass} ${
              dragOverStatus === col.status ? 'admin-drop-active' : ''
            }`}
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold">{col.bookings.length}</span>
              </div>
              <p className="mt-1 text-[11px] opacity-70 md:hidden">
                Columna {index + 1} de {columns.length}
              </p>
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2">
              {dragOverStatus === col.status && (
                <div className="admin-drag-placeholder rounded-xl px-2 py-3 text-center text-[10px]">
                  Deixa anar aquí
                </div>
              )}
              {col.bookings.length === 0 && dragOverStatus !== col.status && (
                <div className="rounded-xl border border-dashed p-4 text-center text-xs">
                  Cap reserva
                </div>
              )}
              {col.bookings.map((booking) => {
                const isUpdating = updatingId === booking.id;
                const statusIndex = COLUMNS_DEF.findIndex((c) => c.status === col.status);
                const canForward = statusIndex < COLUMNS_DEF.length - 1;
                const canBack = statusIndex > 0;

                return (
                  <div
                    key={booking.id}
                    draggable={!isUpdating}
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', booking.id); e.dataTransfer.effectAllowed = 'move'; setDraggingId(booking.id); }}
                    onDragEnd={() => { setDraggingId(null); setDragOverStatus(null); }}
                    data-dragging={draggingId === booking.id || undefined}
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
                            onClick={() => moveBooking(booking.id, COLUMNS_DEF[statusIndex - 1].status)}
                            disabled={isUpdating}
                            className="rounded px-1 py-0.5 text-[10px] hover:bg-black/20 transition-colors disabled:opacity-50"
                            title={`Moure a ${COLUMNS_DEF[statusIndex - 1].label}`}
                          >
                            ←
                          </button>
                        )}
                        {canForward && (
                          <button
                            type="button"
                            onClick={() => moveBooking(booking.id, COLUMNS_DEF[statusIndex + 1].status)}
                            disabled={isUpdating}
                            className="rounded px-1 py-0.5 text-[10px] hover:bg-black/20 transition-colors disabled:opacity-50"
                            title={`Moure a ${COLUMNS_DEF[statusIndex + 1].label}`}
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
                      <span className="text-[10px]">
                        {formatDateShort(booking.eventDate)}
                      </span>
                      <span className="font-semibold text-[10px]">
                        {formatCurrency(booking.total)}
                      </span>
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
                      {COLUMNS_DEF.filter((c) => c.status !== col.status).map((target) => (
                        <button
                          key={target.status}
                          onClick={() => moveBooking(booking.id, target.status)}
                          disabled={isUpdating}
                          className="ap-btn ap-btn--secondary flex-1 px-2.5 py-2 text-xs min-h-[44px] disabled:opacity-50"
                        >
                          {target.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



