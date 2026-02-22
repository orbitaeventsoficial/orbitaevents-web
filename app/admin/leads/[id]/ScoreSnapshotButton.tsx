'use client';

import { useState } from 'react';

export default function ScoreSnapshotButton({ leadId }: { leadId: string }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveSnapshot() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut desar el snapshot');
      }
      setMsg(`Snapshot desat · score ${data.score}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error inesperat');
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
        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/5 disabled:opacity-60"
      >
        {saving ? 'Desant...' : 'Desar snapshot score'}
      </button>
      {msg && <p className="mt-1 text-xs">{msg}</p>}
    </div>
  );
}
