'use client';

import { useState } from 'react';

export default function SendExecutiveReportButton() {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendReport() {
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/reports/executive/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut enviar l\'informe');
      }
      setMsg(`Informe enviat a ${data.recipient}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error inesperat');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={sendReport}
        disabled={sending}
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {sending ? 'Enviant...' : 'Envia informe executiu'}
      </button>
      {msg && <p className="text-xs">{msg}</p>}
    </div>
  );
}



