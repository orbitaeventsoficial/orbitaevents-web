'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateDailyChecklistButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/tasks/daily-checklist', {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s’ha pogut generar');
      }
      setMessage(`Checklist d’avui: ${data.created} creats, ${data.skipped} ja existien.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error generant checklist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-60"
      >
        {loading ? 'Generant...' : 'Generar checklist d’avui'}
      </button>
      {message && <p className="text-[11px] text-slate-400">{message}</p>}
    </div>
  );
}

