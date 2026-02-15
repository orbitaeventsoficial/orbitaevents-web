'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  leadId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'Nou Lead', color: 'bg-blue-500' },
  { value: 'CONTACTED', label: 'Contactat', color: 'bg-yellow-500' },
  { value: 'QUOTE_SENT', label: 'Pressupost enviat', color: 'bg-purple-500' },
  { value: 'NEGOTIATING', label: 'En negociació', color: 'bg-orange-500' },
  { value: 'WON', label: 'Guanyat!', color: 'bg-green-500' },
  { value: 'LOST', label: 'Perdut', color: 'bg-gray-400' },
];

export default function LeadActions({ leadId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error actualitzant estat');
      }

      setSuccess('Estat actualitzat!');
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconegut');
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">Canviar estat</h3>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            disabled={isPending || status.value === currentStatus}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
              status.value === currentStatus
                ? 'bg-white/5 border-2 border-slate-400 font-medium'
                : 'border border-white/10 hover:bg-white/5 hover:border-white/10'
            } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`w-3 h-3 rounded-full ${status.color}`} />
            <span className={status.value === currentStatus ? 'text-slate-200' : 'text-slate-200'}>
              {status.label}
            </span>
            {status.value === currentStatus && (
              <span className="ml-auto text-xs text-slate-400">Actual</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}



