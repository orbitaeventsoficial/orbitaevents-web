'use client';

import { useMemo, useState } from 'react';
import { fetchWithCsrf } from '@/lib/csrf';

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
      const res = await fetchWithCsrf(`/api/admin/leads/${leadId}/snapshot`, {
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
    <details open className="ap-card p-6">
      <summary className="cursor-pointer text-sm font-semibold">
        Snapshot técnico (JSON)
      </summary>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copySnapshot}
            className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs"
          >
            Copiar JSON
          </button>
          <button
            type="button"
            onClick={downloadSnapshot}
            className="ap-btn ap-btn--secondary px-3 py-1.5 text-xs"
          >
            Descarregar .json
          </button>
          <button
            type="button"
            onClick={() => runAction('save_document')}
            disabled={busy !== null}
            className="ap-btn ap-btn--primary px-3 py-1.5 text-xs disabled:opacity-60"
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
            className="ap-input w-full px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => runAction('send_email')}
            disabled={busy !== null}
            className="ap-btn ap-btn--primary px-3 py-2 text-xs disabled:opacity-60"
          >
            {busy === 'send_email' ? 'Enviant...' : 'Enviar per correu intern'}
          </button>
        </div>

        {message ? <p className="text-xs">{message}</p> : null}
      </div>

      <pre className="admin-tone-bg-neutral mt-4 max-h-80 overflow-auto rounded-xl p-3 text-xs">
        {snapshotJson}
      </pre>
    </details>
  );
}




