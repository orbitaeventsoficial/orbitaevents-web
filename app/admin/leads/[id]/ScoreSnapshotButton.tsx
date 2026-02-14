'use client';

import { useState } from 'react';

export default function ScoreSnapshotButton({ leadId }: { leadId: string }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveSnapshot() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/leads-new/${leadId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No se pudo guardar snapshot');
      }
      setMsg(`Snapshot guardado · score ${data.score}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={saveSnapshot}
        disabled={saving}
        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {saving ? 'Guardando...' : 'Guardar snapshot score'}
      </button>
      {msg && <p className="mt-1 text-xs text-slate-500">{msg}</p>}
    </div>
  );
}

