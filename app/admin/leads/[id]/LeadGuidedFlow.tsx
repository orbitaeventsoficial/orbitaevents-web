'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';
import { LEAD_GUIDED_STEPS, LEAD_GUIDED_STATUS_ORDER } from '@/lib/constants';
import { ADMIN_LEAD_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { buildCustomerHubHref } from '@/lib/admin/customerWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import LeadLostStatusPrompt from '../LeadLostStatusPrompt';
import { patchLeadStatus } from '../leadStatusClient';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';

const STEPS = LEAD_GUIDED_STEPS;
const STATUS_ORDER = LEAD_GUIDED_STATUS_ORDER;

function getStatusIndex(status: LeadStatus): number {
  const idx = (STATUS_ORDER as readonly string[]).indexOf(status);
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
  const [statusBusy, setStatusBusy] = useState(false);
  const [showLostPrompt, setShowLostPrompt] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [lostNote, setLostNote] = useState('');

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

  const updateStatus = useCallback(async (nextStatus: LeadStatus) => {
    if (statusBusy) return;
    if (nextStatus === 'LOST') {
      setShowLostPrompt(true);
      return;
    }
    setError(null);
    const previous = status;
    setStatus(nextStatus);
    setStatusBusy(true);

    try {
      const payload = await patchLeadStatus({ leadId, status: nextStatus });
      const customerId = payload?.lead?.customerId as string | undefined;
      startTransition(() => {
        if (nextStatus === 'WON') {
          router.push(`/admin/bookings/new?leadId=${encodeURIComponent(leadId)}`);
          return;
        }
        router.refresh();
      });
    } catch (e) {
      setStatus(previous);
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setStatusBusy(false);
    }
  }, [leadId, router, startTransition, status, statusBusy]);

  const confirmLostStatus = async () => {
    if (!lostReason || statusBusy) return;
    setError(null);
    const previous = status;
    setStatus('LOST');
    setStatusBusy(true);

    try {
      await patchLeadStatus({
        leadId,
        status: 'LOST',
        lostReason,
        note: lostNote,
      });
      setShowLostPrompt(false);
      setLostReason('');
      setLostNote('');
      startTransition(() => router.refresh());
    } catch (e) {
      setStatus(previous);
      setError(e instanceof Error ? e.message : 'Error desconegut');
    } finally {
      setStatusBusy(false);
    }
  };

  const createFollowUpTask = async () => {
    if (creatingTask) return;
    setCreatingTask(true);
    setError(null);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 2);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/tasks`, {
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
    if (hasBooking && bookingId) return { label: 'Veure reserva', href: buildBookingHref(bookingId) };
    return null;
  }, [currentIndex, isLost, hasBooking, bookingId, leadId, updateStatus]);

  return (
    <section className="ap-card p-5" {...helpAttrs(ADMIN_LEAD_HELP.guided.root)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Pipeline comercial</h2>
          <p className="text-sm">
            Progr\u00e9s: {progress.stepsDone}/{progress.total} passos completats
          </p>
        </div>
        {isLost && (
          <div className="ap-badge px-3 py-1 text-xs">
            PERDUT
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="admin-tone-bg-neutral mt-3 h-2 w-full overflow-hidden rounded-full">
        <div
          className="admin-tone-bg-info h-full rounded-full transition-all duration-500"
          style={{ width: `${progress.pct}%` }}
        />
      </div>

      {error && (
        <p className="ap-card admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger mt-3 px-3 py-2 text-xs">
          {error}
        </p>
      )}

      {/* Pipeline steps */}
      <div className="mt-4 flex flex-col gap-1 lg:flex-row lg:gap-0">
        {STEPS.map((step, i) => {
          const stepIndex = getStatusIndex(step.status);
          const isDone = currentIndex > stepIndex;
          const isActive = currentIndex === stepIndex && !isLost;
          const canClick = !isLost && !isPending && !statusBusy && stepIndex > currentIndex;

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
                <span className={`hidden lg:block mx-1 text-lg ${isDone ? 'admin-tone-text-success' : 'admin-tone-text-neutral'}`}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Next suggested action + quick actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2" {...helpAttrs(ADMIN_LEAD_HELP.guided.actions)}>
        {nextAction && (
          nextAction.href ? (
            <Link
              href={nextAction.href}
              className="ap-btn ap-btn--primary px-4 py-2 text-xs"
            >
              {nextAction.label} →
            </Link>
          ) : (
            <button
              type="button"
              onClick={nextAction.action}
              disabled={isPending || statusBusy}
              className="ap-btn ap-btn--primary px-4 py-2 text-xs disabled:opacity-50"
            >
              {nextAction.label} →
            </button>
          )
        )}

        <button
          type="button"
          onClick={createFollowUpTask}
          disabled={creatingTask}
          className="ap-btn ap-btn--secondary px-3 py-2 text-xs disabled:opacity-60"
        >
          {creatingTask ? 'Creant...' : '+ Tasca de seguiment'}
        </button>

        {openTasksCount > 0 && (
          <a
            href="#lead-tasks"
            className="ap-btn ap-btn--secondary px-3 py-2 text-xs"
          >
            Tasques ({openTasksCount})
          </a>
        )}

        {!isLost && (
          <button
            type="button"
            onClick={() => updateStatus('LOST')}
            disabled={isPending || statusBusy}
            className="ap-btn ap-btn--secondary px-3 py-2 text-xs disabled:opacity-50"
          >
            Marcar perdut
          </button>
        )}

        {isLost && (
          <button
            type="button"
            onClick={() => updateStatus('NEW')}
            disabled={isPending || statusBusy}
            className="ap-btn ap-btn--secondary px-3 py-2 text-xs disabled:opacity-50"
          >
            Reobrir entrada
          </button>
        )}
      </div>

      <LeadLostStatusPrompt
        open={showLostPrompt}
        lostReason={lostReason}
        note={lostNote}
        saving={isPending || statusBusy}
        title="Per marcar aquesta entrada com a perduda cal classificar-ne el motiu."
        confirmLabel="Guardar motiu i tancar"
        onLostReasonChange={setLostReason}
        onNoteChange={setLostNote}
        onCancel={() => {
          setShowLostPrompt(false);
          setLostReason('');
          setLostNote('');
        }}
        onConfirm={confirmLostStatus}
      />
    </section>
  );
}



