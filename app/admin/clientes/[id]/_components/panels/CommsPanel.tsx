'use client';

import type { CustomerHubDTO } from '@/lib/customer-hub/dto';
import { formatDateTime } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

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
      const res = await fetchWithCsrf(`/api/admin/customers/${data.customer.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'NOTE_ADDED',
          note: clean,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No s’ha pogut desar la nota');
      }
      setNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desant la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border p-5" data-help-title="Comunicacions" data-help-desc="Historial de correus enviats, notes internes i seguiment. Pots enviar plantilles predefinides o afegir notes ràpides.">
      <h2 className="text-lg font-semibold">Comunicacions</h2>
      <p className="mt-1 text-sm">Historial de correus, notes i seguiment.</p>

      <div className="mt-3 rounded-xl border p-3" data-help-title="Accions ràpides" data-help-desc="Accesos directes per enviar plantilles d'email o crear tasques de seguiment vinculades al client.">
        <p className="text-xs">Accions ràpides</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={`/admin/inbox/compose?customerId=${data.customer.id}&template=primer-contacte`}
            className="rounded border px-2 py-1 text-xs"
          >
            Plantilla 1r contacte
          </Link>
          <Link
            href={`/admin/inbox/compose?customerId=${data.customer.id}&template=enviament-pressupost`}
            className="rounded border px-2 py-1 text-xs"
          >
            Envia pressupost
          </Link>
          <Link
            href={`/admin/inbox/compose?customerId=${data.customer.id}&template=recordatori`}
            className="rounded border px-2 py-1 text-xs"
          >
            Recordatori
          </Link>
          <Link
            href={`/admin/tasks/new?customerId=${data.customer.id}`}
            className="rounded border px-2 py-1 text-xs"
          >
            Crear tasca de seguiment
          </Link>
        </div>
      </div>

      <div className="mt-3 rounded-xl border p-3" data-help-title="Nota interna" data-help-desc="Escriu una nota de seguiment que quedarà registrada al timeline del client. Útil per apuntar trucades o decisions.">
        <p className="text-xs">Afegir nota interna</p>
        <textarea
          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
          rows={3}
          placeholder="Escriu una nota de seguiment..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && (
          <p className="mt-2 rounded-md border px-2 py-1 text-xs">
            {error}
          </p>
        )}
        <div className="mt-2">
          <button
            type="button"
            onClick={saveNote}
            disabled={saving || !note.trim()}
            className="rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Desant...' : 'Desa nota'}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {data.messages.length === 0 ? (
          <p className="rounded-xl border p-3 text-sm">
            No hi ha comunicacions encara.
          </p>
        ) : (
          data.messages.slice(0, 40).map((message) => (
            <article key={message.id} className="rounded-xl border p-3">
              <p className="text-xs font-semibold">{message.subject || message.channel}</p>
              {message.bodyPreview && <p className="mt-1 text-xs">{message.bodyPreview}</p>}
              <p className="mt-1 text-[11px]">
                {formatDateTime(message.createdAt)}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
