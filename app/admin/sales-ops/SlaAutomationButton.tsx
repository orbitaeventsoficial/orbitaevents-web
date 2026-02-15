'use client';

import { useState } from 'react';

type Result = {
  staleLeads: number;
  createdTasks: number;
  escalatedPriority: number;
};

export default function SlaAutomationButton() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/automation/enforce-sla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut executar l\'automatització');
      }
      setResult({
        staleLeads: data.staleLeads || 0,
        createdTasks: data.createdTasks || 0,
        escalatedPriority: data.escalatedPriority || 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperat');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {running ? 'Executant...' : 'Executar regles SLA'}
      </button>
      {result && (
        <p className="text-xs text-emerald-300">
          OK: leads inactius {result.staleLeads}, tasques creades {result.createdTasks}, prioritats elevades {result.escalatedPriority}.
        </p>
      )}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </div>
  );
}



