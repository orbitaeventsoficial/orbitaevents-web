'use client';

import { useState } from 'react';

export default function RunCommercialSequencesButton() {
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/automation/commercial-sequences/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut executar seqüències');
      }
      const s = data.summary;
      setMsg(`Executat: ${s.executed} · correu ${s.sentEmail} · WA ${s.sentWhatsapp} · errors ${s.errors}`);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error executant seqüències');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        {running ? 'Executant...' : 'Executar seqüències comercials'}
      </button>
      {msg && <p className="text-xs text-slate-300">{msg}</p>}
    </div>
  );
}


