'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  const handleDelete = async () => {
    if (hasBooking) {
      alert("No es pot eliminar una entrada amb reserva associada");
      return;
    }

    if (!confirm(`Segur que vols eliminar l'entrada "${leadName}"?\n\nAquesta acció no es pot desfer.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error eliminant l'entrada");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error eliminant l'entrada");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (nextStatus: LeadActionsProps['currentStatus']) => {
    if (statusUpdating || nextStatus === currentStatus) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}/status`, {
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
      alert(error instanceof Error ? error.message : "Error actualitzant l'estat");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePriorityChange = async (nextPriority: LeadActionsProps['currentPriority']) => {
    if (priorityUpdating || nextPriority === currentPriority) return;
    setPriorityUpdating(true);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}`, {
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
      alert(error instanceof Error ? error.message : "Error actualitzant la prioritat");
    } finally {
      setPriorityUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value as LeadActionsProps['currentStatus'])}
        disabled={statusUpdating}
        className="rounded-lg border border-slate-600/50 bg-slate-800/80 px-2 py-1.5 text-xs text-slate-200"
        title="Canviar estat"
      >
        <option value="NEW">Entrada nova</option>
        <option value="CONTACTED">Contactat</option>
        <option value="QUOTE_SENT">Pressupost enviat</option>
        <option value="NEGOTIATING">Negociació</option>
        <option value="WON">Guanyat</option>
        <option value="LOST">Perdut</option>
      </select>
      <select
        value={currentPriority}
        onChange={(e) => handlePriorityChange(e.target.value as LeadActionsProps['currentPriority'])}
        disabled={priorityUpdating}
        className="rounded-lg border border-slate-600/50 bg-slate-800/80 px-2 py-1.5 text-xs text-slate-200"
        title="Canviar prioritat"
      >
        <option value="LOW">Baixa</option>
        <option value="MEDIUM">Mitjana</option>
        <option value="HIGH">Alta</option>
        <option value="URGENT">Urgent</option>
      </select>
      {phone && (
        <a
          href={`https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(
            `Hola ${leadName}! Sóc de Òrbita Events, hem rebut la teva sol·licitud i volem ajudar-te a organitzar el teu event.`
          )}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
          title="Envia per WhatsApp"
        >
          💬 WA
        </a>
      )}
      <Link
        href={`/admin/leads/${leadId}`}
        className="inline-flex items-center rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600/50 border border-slate-600/50 transition-colors"
      >
        Veure
      </Link>
      <button
        onClick={handleDelete}
        disabled={isDeleting || hasBooking}
        type="button"
        aria-busy={isDeleting}
        className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors
          ${hasBooking
            ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-600/30'
            : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
          }`}
        title={hasBooking ? 'No es pot eliminar (té reserva)' : 'Elimina entrada'}
      >
        {isDeleting ? '...' : '🗑️'}
      </button>
    </div>
  );
}

