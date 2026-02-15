'use client';

import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CommsPanel({ data }: { data: CustomerHubDTO }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveNote = async () => {
    const clean = note.trim();
    if (!clean || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${data.customer.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'NOTE_ADDED',
          note: clean,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No s’ha pogut guardar la nota');
      }
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardant la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <h2 className="text-lg font-semibold text-slate-100">Comunicacions</h2>
      <p className="mt-1 text-sm text-slate-400">Historial de correus, notes i seguiment.</p>

      <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
        <p className="text-xs text-slate-400">Accions ràpides</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={`/admin/emails?customerId=${data.customer.id}&template=primer-contacte`}
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Plantilla 1r contacte
          </Link>
          <Link
            href={`/admin/emails?customerId=${data.customer.id}&template=enviament-pressupost`}
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Enviar pressupost
          </Link>
          <Link
            href={`/admin/emails?customerId=${data.customer.id}&template=recordatori`}
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Recordatori
          </Link>
          <Link
            href={`/admin/tasks/new?customerId=${data.customer.id}`}
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            Crear tasca de seguiment
          </Link>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
        <p className="text-xs text-slate-400">Afegir nota interna</p>
        <textarea
          className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          rows={3}
          placeholder="Escriu una nota de seguiment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && (
          <p className="mt-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200">
            {error}
          </p>
        )}
        <div className="mt-2">
          <button
            type="button"
            onClick={saveNote}
            disabled={saving || !note.trim()}
            className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {saving ? 'Guardant...' : 'Guardar nota'}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {data.messages.length === 0 ? (
          <p className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-3 text-sm text-slate-400">
            No hi ha comunicacions encara.
          </p>
        ) : (
          data.messages.slice(0, 40).map((message) => (
            <article key={message.id} className="rounded-xl border border-slate-700/70 bg-slate-800/60 p-3">
              <p className="text-xs font-semibold text-slate-200">{message.subject || message.channel}</p>
              {message.bodyPreview && <p className="mt-1 text-xs text-slate-400">{message.bodyPreview}</p>}
              <p className="mt-1 text-[11px] text-slate-500">
                {new Date(message.createdAt).toLocaleDateString('ca-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

