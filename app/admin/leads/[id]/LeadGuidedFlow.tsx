'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';

const STATUS_ORDER: LeadStatus[] = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON', 'LOST'];

function hasReachedStatus(current: LeadStatus, target: LeadStatus) {
  const currentIndex = STATUS_ORDER.indexOf(current);
  const targetIndex = STATUS_ORDER.indexOf(target);
  return currentIndex >= targetIndex;
}

export default function LeadGuidedFlow({
  leadId,
  currentStatus,
  hasCustomer,
  hasBooking,
  bookingId,
  documentsCount,
  openTasksCount,
}: {
  leadId: string;
  currentStatus: LeadStatus;
  hasCustomer: boolean;
  hasBooking: boolean;
  bookingId?: string | null;
  documentsCount: number;
  openTasksCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);

  const progress = useMemo(() => {
    const stepsDone = [
      hasReachedStatus(status, 'CONTACTED'),
      hasReachedStatus(status, 'QUOTE_SENT'),
      documentsCount > 0,
      hasReachedStatus(status, 'WON') || hasCustomer,
      hasBooking,
    ].filter(Boolean).length;
    return { stepsDone, total: 5 };
  }, [status, documentsCount, hasCustomer, hasBooking]);

  const updateStatus = async (nextStatus: LeadStatus) => {
    setError(null);
    const previous = status;
    setStatus(nextStatus);

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No s’ha pogut actualitzar l’estat');
      }
      const payload = await res.json();
      const customerId = payload?.lead?.customerId as string | undefined;
      startTransition(() => {
        if (nextStatus === 'WON' && customerId) {
          router.push(`/admin/contactes/${customerId}`);
          return;
        }
        router.refresh();
      });
    } catch (e) {
      setStatus(previous);
      setError(e instanceof Error ? e.message : 'Error desconegut');
    }
  };

  const createFollowUpTask = async () => {
    if (creatingTask) return;
    setCreatingTask(true);
    setError(null);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Seguiment comercial: confirmar proper pas amb el client',
          priority: 'HIGH',
          dueDate: dueDate.toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No s’ha pogut crear la tasca');
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setCreatingTask(false);
    }
  };

  return (
    <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Asistente comercial (paso a paso)</h2>
          <p className="text-sm text-slate-300">
            Progreso {progress.stepsDone}/{progress.total}. Pulsa un botón y sigue al siguiente paso.
          </p>
        </div>
        <div className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          Estado: {status}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => updateStatus('CONTACTED')}
          disabled={isPending || hasReachedStatus(status, 'CONTACTED')}
          className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-50"
        >
          1) Marcar CONTACTED
        </button>
        <button
          type="button"
          onClick={() => updateStatus('QUOTE_SENT')}
          disabled={isPending || hasReachedStatus(status, 'QUOTE_SENT')}
          className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-50"
        >
          2) Marcar QUOTE_SENT
        </button>
        <a
          href="#lead-documents"
          className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-center text-xs font-semibold text-slate-100 hover:bg-slate-800"
        >
          3) Ir a documentos PDF
        </a>
        <button
          type="button"
          onClick={() => updateStatus('WON')}
          disabled={isPending || hasReachedStatus(status, 'WON')}
          className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-50"
        >
          4) Marcar WON (cliente)
        </button>
        <Link
          href={hasBooking && bookingId ? `/admin/bookings/${bookingId}` : '/admin/bookings'}
          className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-center text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
        >
          {hasBooking ? '5) Ver reserva' : '5) Ir a reservas'}
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={createFollowUpTask}
          disabled={creatingTask}
          className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
        >
          {creatingTask ? 'Creando tarea...' : 'Crear tarea de seguimiento'}
        </button>
        <a
          href="#lead-tasks"
          className="rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800"
        >
          Ver tareas ({openTasksCount})
        </a>
      </div>
    </section>
  );
}
