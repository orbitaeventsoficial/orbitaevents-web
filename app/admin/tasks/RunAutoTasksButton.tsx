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
    <div className="tk__auto-btn">
      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="tk__btn"
      >
        {loading ? 'Executant...' : '⚡ Auto-tasques'}
      </button>
      {message && <p className="tk__auto-msg">{message}</p>}
    </div>
  );
}
