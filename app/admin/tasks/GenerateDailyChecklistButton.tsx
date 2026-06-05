'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithCsrf } from '@/lib/csrf';

export default function GenerateDailyChecklistButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetchWithCsrf('/api/admin/tasks/daily-checklist', {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "No s'ha pogut generar");
      }
      if ((data.considered ?? 0) === 0) {
        setMessage(`Checklist d'avui: cap tasca pendent real. Netejades ${data.staleCancelled ?? 0} antigues.`);
      } else {
        setMessage(
          `Checklist d'avui: ${data.created} creats, ${data.skipped} ja existien, ${data.todayCancelled ?? 0} desactivades.`
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
    <div className="tk__auto-btn">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="tk__btn"
      >
        {loading ? 'Generant...' : "Checklist d'avui"}
      </button>
      {message && <p className="tk__auto-msg">{message}</p>}
    </div>
  );
}
