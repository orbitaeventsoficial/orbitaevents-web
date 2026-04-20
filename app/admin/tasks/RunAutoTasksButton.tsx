'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

export default function RunAutoTasksButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRun = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetchWithCsrf('/api/admin/tasks/auto', {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error');
      }
      if (data.proposed === 0) {
        setMessage('Cap tasca automàtica necessària.');
      } else {
        setMessage(`${data.created} creades, ${data.skipped} ja existien (${data.proposed} proposades).`);
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold hover:bg-white/[0.06] transition-colors disabled:opacity-60"
      >
        {loading ? 'Executant...' : '⚡ Auto-tasques'}
      </button>
      {message && <p className="text-[11px] opacity-60">{message}</p>}
    </div>
  );
}
