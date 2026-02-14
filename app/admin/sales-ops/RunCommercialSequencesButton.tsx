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
        throw new Error(data?.error || 'No se pudo ejecutar secuencias');
      }
      const s = data.summary;
      setMsg(`Ejecutado: ${s.executed} · email ${s.sentEmail} · WA ${s.sentWhatsapp} · errores ${s.errors}`);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error ejecutando secuencias');
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
        {running ? 'Ejecutando...' : 'Run secuencias comerciales'}
      </button>
      {msg && <p className="text-xs text-slate-500">{msg}</p>}
    </div>
  );
}
