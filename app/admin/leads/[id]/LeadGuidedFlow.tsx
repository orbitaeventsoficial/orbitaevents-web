'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';

const STEPS: Array<{
  status: LeadStatus;
  label: string;
  icon: string;
  color: string;
  activeColor: string;
  doneColor: string;
}> = [
  {
    status: 'NEW',
    label: 'Entrada nova',
    icon: '📥',
    color: 'border-blue-500/30 bg-blue-500/5 text-blue-300',
    activeColor: 'border-blue-400 bg-blue-500/20 text-blue-200 ring-2 ring-blue-400/50',
    doneColor: 'border-blue-500/50 bg-blue-500/15 text-blue-300',
  },
  {
    status: 'CONTACTED',
    label: 'Contactat',
    icon: '📞',
    color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-300',
    activeColor: 'border-yellow-400 bg-yellow-500/20 text-yellow-200 ring-2 ring-yellow-400/50',
    doneColor: 'border-yellow-500/50 bg-yellow-500/15 text-yellow-300',
  },
  {
    status: 'QUOTE_SENT',
    label: 'Pressupost enviat',
    icon: '📄',
    color: 'border-purple-500/30 bg-purple-500/5 text-purple-300',
    activeColor: 'border-purple-400 bg-purple-500/20 text-purple-200 ring-2 ring-purple-400/50',
    doneColor: 'border-purple-500/50 bg-purple-500/15 text-purple-300',
  },
  {
    status: 'NEGOTIATING',
    label: 'Negociant',
    icon: '🤝',
    color: 'border-orange-500/30 bg-orange-500/5 text-orange-300',
    activeColor: 'border-orange-400 bg-orange-500/20 text-orange-200 ring-2 ring-orange-400/50',
    doneColor: 'border-orange-500/50 bg-orange-500/15 text-orange-300',
  },
  {
    status: 'WON',
    label: 'Guanyat!',
    icon: '🎉',
    color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
    activeColor: 'border-emerald-400 bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-400/50',
    doneColor: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300',
  },
];

const STATUS_ORDER: LeadStatus[] = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'NEGOTIATING', 'WON'];

function getStatusIndex(status: LeadStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
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

  const isLost = status === 'LOST';
  const currentIndex = getStatusIndex(status);

  const progress = useMemo(() => {
    const stepsDone = [
      currentIndex >= 1, // Contactat
      currentIndex >= 2, // Pressupost enviat
      currentIndex >= 3, // Negociant
      currentIndex >= 4 || hasCustomer, // Guanyat
      hasBooking, // Reserva creada
    ].filter(Boolean).length;
    return { stepsDone, total: 5, pct: Math.round((stepsDone / 5) * 100) };
  }, [currentIndex, hasCustomer, hasBooking]);

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
        throw new Error(data.error || "No s'ha pogut actualitzar l'estat");
      }
      const payload = await res.json();
      const customerId = payload?.lead?.customerId as string | undefined;
      startTransition(() => {
        if (nextStatus === 'WON' && customerId) {
          router.push(`/admin/clientes/${customerId}`);
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
      const res = await fetch(`/api/admin/leads/${leadId}/tasks`, {
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
        throw new Error(data.error || "No s'ha pogut crear la tasca");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setCreatingTask(false);
    }
  };

  // Suggest next action
  const nextAction = useMemo(() => {
    if (isLost) return null;
    if (currentIndex === 0) return { label: 'Contactar client', action: () => updateStatus('CONTACTED') };
    if (currentIndex === 1) return { label: 'Enviar pressupost', href: `/admin/presupuestos?leadId=${leadId}` };
    if (currentIndex === 2) return { label: 'Iniciar negociaci\u00f3', action: () => updateStatus('NEGOTIATING') };
    if (currentIndex === 3) return { label: 'Marcar com a guanyat', action: () => updateStatus('WON') };
    if (currentIndex === 4 && !hasBooking) return { label: 'Crear reserva', href: `/admin/bookings/new?leadId=${leadId}` };
    if (hasBooking && bookingId) return { label: 'Veure reserva', href: `/admin/bookings/${bookingId}` };
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isLost, hasBooking, bookingId, leadId]);

  return (
    <section className="rounded-2xl border p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Pipeline comercial</h2>
          <p className="text-sm">
            Progr\u00e9s: {progress.stepsDone}/{progress.total} passos completats
          </p>
        </div>
        {isLost && (
          <div className="rounded-full border px-3 py-1 text-xs font-semibold">
            PERDUT
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress.pct}%` }}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-xl border px-3 py-2 text-xs">
          {error}
        </p>
      )}

      {/* Pipeline steps */}
      <div className="mt-4 flex flex-col gap-1 lg:flex-row lg:gap-0">
        {STEPS.map((step, i) => {
          const stepIndex = getStatusIndex(step.status);
          const isDone = currentIndex > stepIndex;
          const isActive = currentIndex === stepIndex && !isLost;
          const canClick = !isLost && !isPending && stepIndex > currentIndex;

          const stepClass = isActive
            ? step.activeColor
            : isDone
              ? step.doneColor
              : step.color;

          return (
            <div key={step.status} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => canClick && updateStatus(step.status)}
                disabled={!canClick}
                className={`relative flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${stepClass} ${
                  canClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                } ${isDone ? 'opacity-70' : ''}`}
              >
                <span className="text-base">{isDone ? '✓' : step.icon}</span>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className={`hidden lg:block mx-1 text-lg ${isDone ? 'text-emerald-500' : 'text-white/40'}`}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Next suggested action + quick actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {nextAction && (
          nextAction.href ? (
            <Link
              href={nextAction.href}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all"
            >
              {nextAction.label} →
            </Link>
          ) : (
            <button
              type="button"
              onClick={nextAction.action}
              disabled={isPending}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all disabled:opacity-50"
            >
              {nextAction.label} →
            </button>
          )
        )}

        <button
          type="button"
          onClick={createFollowUpTask}
          disabled={creatingTask}
          className="rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-60 transition-colors"
        >
          {creatingTask ? 'Creant...' : '+ Tasca de seguiment'}
        </button>

        {openTasksCount > 0 && (
          <a
            href="#lead-tasks"
            className="rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
          >
            Tasques ({openTasksCount})
          </a>
        )}

        {!isLost && (
          <button
            type="button"
            onClick={() => updateStatus('LOST')}
            disabled={isPending}
            className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
          >
            Marcar perdut
          </button>
        )}

        {isLost && (
          <button
            type="button"
            onClick={() => updateStatus('NEW')}
            disabled={isPending}
            className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
          >
            Reobrir entrada
          </button>
        )}
      </div>
    </section>
  );
}

