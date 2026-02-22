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
      if ((data.considered ?? 0) === 0) {
        setMessage(`Checklist d’avui: cap tasca pendent real. Netejades ${data.staleCancelled ?? 0} antigues.`);
      } else {
        setMessage(
          `Checklist d’avui: ${data.created} creats, ${data.skipped} ja existien, ${data.todayCancelled ?? 0} desactivades.`
        );
      }
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
        className="admin-tasks-gold-btn inline-flex items-center rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold disabled:opacity-60"
      >
        {loading ? 'Generant...' : 'Generar checklist d’avui'}
      </button>
      {message && <p className="text-[11px]">{message}</p>}
    </div>
  );
}
