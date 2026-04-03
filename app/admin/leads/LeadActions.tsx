'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';
import { LEAD_STATUS_OPTIONS, PRIORITY_LABELS } from '@/lib/constants';

interface LeadActionsProps {
  leadId: string;
  leadName: string;
  phone?: string | null;
  hasBooking: boolean;
  currentStatus: 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST';
  currentPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export default function LeadActions({ leadId, leadName, phone, hasBooking, currentStatus, currentPriority }: LeadActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [priorityUpdating, setPriorityUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { confirm, dialogProps } = useConfirmDialog();

  const handleDelete = async () => {
    if (hasBooking) {
      setActionError("No es pot eliminar una entrada amb reserva associada");
      return;
    }

    const ok = await confirm({ title: 'Eliminar entrada', message: `Segur que vols eliminar l'entrada "${leadName}"?\n\nAquesta acció no es pot desfer.`, confirmLabel: 'Eliminar', variant: 'danger' });
    if (!ok) return;

    setIsDeleting(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error eliminant l'entrada");
      }

      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Error eliminant l'entrada");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (nextStatus: LeadActionsProps['currentStatus']) => {
    if (statusUpdating || nextStatus === currentStatus) return;
    setStatusUpdating(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error actualitzant l'estat");
      }
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Error actualitzant l'estat");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePriorityChange = async (nextPriority: LeadActionsProps['currentPriority']) => {
    if (priorityUpdating || nextPriority === currentPriority) return;
    setPriorityUpdating(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: nextPriority }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Error actualitzant la prioritat");
      }
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Error actualitzant la prioritat");
    } finally {
      setPriorityUpdating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      {actionError && (
        <div className="ap-card admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger flex items-center gap-2 px-2 py-1 text-[10px]">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} aria-label="Tancar error">✕</button>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value as LeadActionsProps['currentStatus'])}
          disabled={statusUpdating}
          className="ap-input px-2 py-1.5 text-xs"
          title="Canviar estat"
                >
          {LEAD_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={currentPriority}
          onChange={(e) => handlePriorityChange(e.target.value as LeadActionsProps['currentPriority'])}
          disabled={priorityUpdating}
          className="ap-input px-2 py-1.5 text-xs"
          title="Canviar prioritat"
                >
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {phone && (
          <a
            href={`https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
              `Hola ${leadName}! Sóc de Òrbita Events, hem rebut la teva sol·licitud i volem ajudar-te a organitzar el teu event.`
            )}`}
            target="_blank" rel="noopener noreferrer"
            className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs"
            title="Envia per WhatsApp"
          >
            💬 WA
          </a>
        )}
        <Link
          href={`/admin/leads/${leadId}`}
          className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs"
        >
          Veure
        </Link>
        <button
          onClick={handleDelete}
          disabled={isDeleting || hasBooking || currentStatus !== 'LOST'}
          type="button"
          aria-busy={isDeleting}
          className={`ap-btn px-2.5 py-1.5 text-xs ${
            hasBooking || currentStatus !== 'LOST'
              ? 'admin-tone-border-neutral admin-tone-bg-neutral admin-tone-text-neutral cursor-not-allowed'
              : 'admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger hover:brightness-105'
          }`}
          title={hasBooking ? 'No es pot eliminar (té reserva)' : currentStatus !== 'LOST' ? 'Canvia a "Perdut" per poder eliminar' : 'Elimina entrada'}
        >
          {isDeleting ? '...' : '🗑️'}
        </button>
        <ConfirmDialog {...dialogProps} />
      </div>
    </div>
  );
}


