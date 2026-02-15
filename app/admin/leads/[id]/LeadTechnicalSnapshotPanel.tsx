'use client';

import { useMemo, useState } from 'react';

type SnapshotAction = 'save_document' | 'send_email';

export default function LeadTechnicalSnapshotPanel({
  leadId,
  snapshotJson,
  defaultEmail,
}: {
  leadId: string;
  snapshotJson: string;
  defaultEmail: string;
}) {
  const [recipient, setRecipient] = useState(defaultEmail);
  const [busy, setBusy] = useState<SnapshotAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filename = useMemo(() => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    return `lead-snapshot-${leadId}-${stamp}.json`;
  }, [leadId]);

  async function runAction(action: SnapshotAction) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          recipient: recipient.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut executar l\'acció');
      }
      setMessage(
        action === 'save_document'
          ? 'Snapshot desat als documents del lead.'
          : `Snapshot enviat per correu a ${data.recipient || recipient}.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error inesperat');
    } finally {
      setBusy(null);
    }
  }

  async function copySnapshot() {
    try {
      await navigator.clipboard.writeText(snapshotJson);
      setMessage('Snapshot copiat al porta-retalls.');
    } catch {
      setMessage('No s\'ha pogut copiar el snapshot.');
    }
  }

  function downloadSnapshot() {
    const blob = new Blob([snapshotJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <details open className="rounded-xl border border-white/10 bg-slate-950/60 p-6 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold text-slate-200">
        Snapshot técnico (JSON)
      </summary>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copySnapshot}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
          >
            Copiar JSON
          </button>
          <button
            type="button"
            onClick={downloadSnapshot}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/5"
          >
            Descarregar .json
          </button>
          <button
            type="button"
            onClick={() => runAction('save_document')}
            disabled={busy !== null}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {busy === 'save_document' ? 'Desant...' : 'Desar en documents'}
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Correu intern"
            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
          />
          <button
            type="button"
            onClick={() => runAction('send_email')}
            disabled={busy !== null}
            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {busy === 'send_email' ? 'Enviant...' : 'Enviar per correu intern'}
          </button>
        </div>

        {message ? <p className="text-xs text-slate-300">{message}</p> : null}
      </div>

      <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-200">
        {snapshotJson}
      </pre>
    </details>
  );
}



